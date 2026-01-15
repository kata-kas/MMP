import { IconExternalLink } from "@tabler/icons-react";
import DOMPurify from "dompurify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { stringToNumber } from "@/core/utils/color.ts";
import { cn } from "@/lib/utils";
import type { Tag } from "@/projects/entities/Project";

type HeaderProps = {
	loading?: boolean;
	title?: string;
	description?: string;
	imagePath?: string;
	link?: string;
	tags?: Tag[];
	onTagClick?: (tag: Tag) => void;
};

const getBadgeColor = (tagValue: string) => {
	const colors = [
		"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
		"bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100",
		"bg-blue-300 text-blue-900 dark:bg-blue-700 dark:text-blue-100",
		"bg-blue-400 text-blue-950 dark:bg-blue-600 dark:text-blue-50",
		"bg-blue-500 text-white dark:bg-blue-500 dark:text-white",
		"bg-blue-600 text-white dark:bg-blue-400 dark:text-blue-950",
		"bg-blue-700 text-white dark:bg-blue-300 dark:text-blue-950",
		"bg-blue-800 text-white dark:bg-blue-200 dark:text-blue-950",
		"bg-blue-900 text-white dark:bg-blue-100 dark:text-blue-950",
		"bg-blue-950 text-white dark:bg-blue-50 dark:text-blue-950",
	];
	return colors[stringToNumber(tagValue, 10) % colors.length];
};

export function Header({
	title,
	description,
	loading,
	imagePath,
	link,
	tags,
	onTagClick,
}: HeaderProps) {
	const fallbackImage =
		"https://images.unsplash.com/photo-1563520239648-a24e51d4b570?q=80&w=2000&h=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
	const img = imagePath ?? fallbackImage;

	const tagWrap = tags?.map((tag, i) =>
		i < 10 ? (
			<Badge
				key={`tag-${tag.value}-${i}`}
				onClick={() => onTagClick?.(tag)}
				className={cn(
					"mx-2 cursor-pointer text-lg",
					getBadgeColor(tag.value, i),
				)}
			>
				{tag.value}
			</Badge>
		) : null,
	);

	if (tagWrap && tags && tags.length > 10) {
		tagWrap.push(
			<Badge
				key={10}
				className={cn("mx-2 text-lg", getBadgeColor(`${tags.length - 10}`, 10))}
			>
				+{tags.length - 10}
			</Badge>,
		);
	}

	return (
		<div
			className="relative flex min-h-[200px] items-center justify-center bg-cover bg-center bg-no-repeat"
			style={{ backgroundImage: `url(${loading ? fallbackImage : img})` }}
		>
			<div className="absolute inset-0 bg-black/65 z-[1]" />

			{loading && (
				<div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/80 backdrop-blur-sm">
					<Skeleton className="h-12 w-12 rounded-full" />
				</div>
			)}

			<div className="relative z-10 mx-auto max-w-4xl px-8 py-16 text-center">
				<h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
					{title}
				</h1>

				{description && (
					<div className="mb-6 text-lg text-white/90 line-clamp-3">
						<div
							dangerouslySetInnerHTML={{
								__html: String(
									(
										DOMPurify as { sanitize: (html: string) => string }
									).sanitize(description),
								),
							}}
						/>
					</div>
				)}

				{tags && tags.length > 0 && (
					<div className="mb-4 flex flex-wrap items-center justify-center">
						{tagWrap}
					</div>
				)}

				{link && (
					<Button
						variant="ghost"
						size="lg"
						className="text-white hover:bg-white/20"
						asChild
					>
						<a
							href={link}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Link"
						>
							<IconExternalLink className="mr-2 h-5 w-5" stroke={1.5} />
							Open Link
						</a>
					</Button>
				)}
			</div>
		</div>
	);
}
