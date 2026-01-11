import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { logger } from "@/lib/logger";

export function ImportProject() {
	const fetchProjectMutation = useApiMutation<void, { url: string }>({
		url: "/downloader/fetch",
		method: "post",
	});

	const form = useForm({
		defaultValues: {
			urls: "",
		},
	});

	const onFetch = (data: { urls: string }) => {
		const urls = data.urls.split("\n");
		fetchProjectMutation
			.mutate({
				url: urls.join(","),
			})
			.then(() => {
				// Project fetch completed
			})
			.catch((e) => {
				logger.error(e);
			});
	};

	return (
		<div className="container mx-auto max-w-4xl">
			<h1 className="mb-4 text-2xl font-bold">Import Project</h1>
			<form onSubmit={form.handleSubmit(onFetch)} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="urls">Thingiverse urls</Label>
					<Textarea
						id="urls"
						placeholder={
							"https://www.thingiverse.com/thing:2631794\nthing:4739346"
						}
						{...form.register("urls", { required: true, minLength: 2 })}
					/>
					{form.formState.errors.urls && (
						<p className="text-sm text-destructive">Too short name</p>
					)}
				</div>
				<p className="text-sm text-muted-foreground">
					Check out{" "}
					<a
						href="https://github.com/Maker-Management-Platform/mmp-companion"
						className="text-primary underline"
					>
						MMP Companion
					</a>{" "}
					to import from more platforms.
				</p>
				<div className="flex justify-end">
					<Button type="submit" disabled={fetchProjectMutation.loading}>
						{fetchProjectMutation.loading ? "Submitting..." : "Submit"}
					</Button>
				</div>
			</form>
		</div>
	);
}
