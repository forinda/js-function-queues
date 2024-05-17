// #region Type aliases (3)

type GenericFunctionType = (...args: any[]) => Promise<any> | any;
type QueueCapacity = 1 | 2 | 3 | 5 | 10 | 15 | 20;
type QueueFunctionType = {
	id: string;
	function: GenericFunctionType;
	is_active: boolean;
	has_errors: boolean;
	errors?: Error[];
	retry_times: number;
	time_of_entry: number;
	end_time: number;
	error_time: number;
	number_of_retries: number;
};

// #endregion Type aliases (3)

// #region Classes (1)

export class FunctionQueueManager {
	// #region Properties (5)

	private _active_job_id: string | null;
	private _is_processing = false;
	private _job_ids_in_queue: Set<string> = new Set();
	private _queue: QueueFunctionType[] = [];
	private _queue_capacity: QueueCapacity;

	// #endregion Properties (5)

	// #region Constructors (1)

	constructor(capacity: QueueCapacity = 10) {
		this._queue = [];
		this._is_processing = false;
		this._active_job_id = null;
		this._queue_capacity = capacity;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (3)

	public get active_job_id() {
		return this._active_job_id;
	}

	public get queue() {
		return this._queue;
	}

	public get queue_capacity() {
		return this._queue_capacity;
	}

	// #endregion Public Getters And Setters (3)

	// #region Public Methods (6)

	// Method to add a function to the queue with an auto-assigned ID
	public enqueue(
		// eslint-disable-next-line @typescript-eslint/ban-types
		fn: GenericFunctionType,
		options: Pick<QueueFunctionType, 'retry_times'> = {
			retry_times: 1
		}
	) {
		if (this.is_empty() || !this.is_full()) {
			const id = this.generate_id();

			this.queue.push({
				function: fn,
				retry_times: options.retry_times,
				has_errors: false,
				id,
				is_active: false,
				number_of_retries: 0,
				errors: [],
				end_time: 0,
				time_of_entry: new Date().getTime(),
				error_time: 0
			});
			this._job_ids_in_queue.add(id);
			this.processQueue();

			return id;
		} else {
			console.log(`Queue is already full`);
		}

		return this;
	}

	public generate_id(length = 16) {
		const hex_characters = '0123456789abcdef';
		let id = '';

		for (let i = 0; i < length; i++) {
			id +=
				hex_characters[
					Math.floor(Math.random() * hex_characters.length)
				];
		}

		return id; //.toUpperCase();
	}

	public get_active_job(id: string) {
		return this.queue.find((job) => job.id === id);
	}

	public is_empty() {
		return this.queue.length < 1;
	}

	public is_full() {
		return this.queue_capacity === this.queue.length;
	}

	// Method to process the queue
	public processQueue() {
		if (this._is_processing) return;

		if (!this.is_empty()) {
			this._is_processing = true;
			const job = this.queue.shift(); // Get the first job from the queue

			if (job) {
				this._active_job_id = job.id;
				job.is_active = true;

				const handleSuccess = <R>(data: R) => {
					job.is_active = false;
					this._is_processing = false;
					this._active_job_id = null;
					job.end_time = new Date().getTime();
					console.info(
						`(${job.function.name}) of id: ${
							job.id
						}: - took ${this.calculateJobDuration(
							job.time_of_entry,
							job.end_time
						)} (ms)`
					);
					this.processQueue(); // Process the next job in the queue

					return data;
				};

				const handleError = (error: any) => {
					job.has_errors = true;
					job.errors?.push(error);
					if (job.number_of_retries < job.retry_times) {
						job.number_of_retries++;
						console.error(
							`Retrying ${job.function.name} for ${job.number_of_retries} time(s)`
						);
						// Retry the job by adding it back to the end of the queue
						this.queue.push(job);
					}
					this._is_processing = false;
					this._active_job_id = null;
					this.processQueue(); // Process the next job in the queue
				};

				try {
					const result = job.function();

					if (result && typeof result.then === 'function') {
						// Handle async function
						this._job_ids_in_queue.delete(job?.id);

						return result.then(handleSuccess).catch(handleError);
					} else {
						// Handle sync function
						this._job_ids_in_queue.delete(job?.id);

						return handleSuccess(result);
					}
				} catch (error) {
					handleError(error);
				}
			}
		} else {
			this._is_processing = false; // If queue is empty, reset processing flag
		}
	}

	// #endregion Public Methods (6)

	// #region Private Methods (1)

	private calculateJobDuration(start: number, end: number) {
		return (end - start) / 1000;
	}

	// #endregion Private Methods (1)
}

// #endregion Classes (1)
