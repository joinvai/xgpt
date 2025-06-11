CREATE TABLE `embeddings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tweet_id` text NOT NULL,
	`model` text NOT NULL,
	`vector` text NOT NULL,
	`dimensions` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tweet_id`) REFERENCES `tweets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scrape_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`username` text NOT NULL,
	`content_type` text NOT NULL,
	`search_scope` text NOT NULL,
	`keywords` text,
	`time_range` text NOT NULL,
	`custom_date_range` text,
	`max_tweets` integer NOT NULL,
	`tweets_collected` integer DEFAULT 0,
	`total_processed` integer DEFAULT 0,
	`content_filtered` integer DEFAULT 0,
	`keyword_filtered` integer DEFAULT 0,
	`date_filtered` integer DEFAULT 0,
	`status` text DEFAULT 'pending' NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`error_message` text,
	`embeddings_generated` integer DEFAULT false,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tweets` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`user_id` integer NOT NULL,
	`username` text NOT NULL,
	`created_at` integer,
	`scraped_at` integer NOT NULL,
	`is_retweet` integer DEFAULT false,
	`is_reply` integer DEFAULT false,
	`likes` integer DEFAULT 0,
	`retweets` integer DEFAULT 0,
	`replies` integer DEFAULT 0,
	`metadata` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`display_name` text,
	`last_scraped` integer,
	`total_tweets` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);