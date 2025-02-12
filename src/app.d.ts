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
			did: string
			paths: string
			createdAt: string
			[k: string]: unknown
		}

		export interface Path {
			x: number
			y: number
			color: string
			size: number
			isNewStroke: boolean
			author: string
			[k: string]: unknown
		}

		export interface dbVector {
			did: string
			vector: string
			created_at: string
			updated_at: string
		}
	}
}

export {};
