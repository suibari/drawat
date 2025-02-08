// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}

		export interface RecordVector {
			paths: Path[]
			createdAt: string
			[k: string]: unknown
		}

		export interface Path {
			x: number
			y: number
			color: string
			size: number
			isNewStroke: boolean
			[k: string]: unknown
		}
	}
}

export {};
