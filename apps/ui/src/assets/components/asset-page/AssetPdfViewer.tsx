import { createPluginRegistration } from "@embedpdf/core";
import { EmbedPDF } from "@embedpdf/core/react";
import { usePdfiumEngine } from "@embedpdf/engines/react";
import {
	DocumentContent,
	DocumentManagerPluginPackage,
} from "@embedpdf/plugin-document-manager/react";
import { RenderLayer, RenderPluginPackage } from "@embedpdf/plugin-render/react";
import { Scroller, ScrollPluginPackage } from "@embedpdf/plugin-scroll/react";
import { Viewport, ViewportPluginPackage } from "@embedpdf/plugin-viewport/react";
import { useContext, useMemo } from "react";
import type { Asset } from "@/assets/entities/Assets";
import { SettingsContext } from "@/core/settings/settingsContext";

export function isPdfAsset(asset: Asset): boolean {
	if (asset.kind?.toLowerCase() === "pdf") return true;
	if (asset.mime_type?.toLowerCase().includes("pdf")) return true;
	if (asset.extension) return asset.extension.toLowerCase() === ".pdf";
	return false;
}

export function AssetPdfViewer({ asset }: { asset: Asset }) {
	const { settings, ready } = useContext(SettingsContext);
	const baseUrl =
		ready && settings?.localBackend && settings.localBackend !== ""
			? settings.localBackend
			: "/api";

	const pdfUrl = useMemo(() => `${baseUrl}/assets/${asset.id}/file`, [baseUrl, asset.id]);

	const plugins = useMemo(
		() => [
			createPluginRegistration(DocumentManagerPluginPackage, {
				initialDocuments: [{ url: pdfUrl }],
			}),
			createPluginRegistration(ViewportPluginPackage),
			createPluginRegistration(ScrollPluginPackage),
			createPluginRegistration(RenderPluginPackage),
		],
		[pdfUrl],
	);

	const { engine, isLoading } = usePdfiumEngine();

	if (isLoading || !engine) {
		return <div className="text-sm text-muted-foreground">Loading PDF engine…</div>;
	}

	return (
		<div className="h-[70vh] w-full overflow-hidden rounded-lg border bg-muted/20">
			<EmbedPDF engine={engine} plugins={plugins} key={pdfUrl}>
				{({ activeDocumentId }) =>
					activeDocumentId && (
						<DocumentContent documentId={activeDocumentId}>
							{({ isLoaded, error }) => {
								if (error) {
									return (
										<div className="p-4 text-sm text-destructive">
											Failed to load PDF.
										</div>
									);
								}
								if (!isLoaded) {
									return (
										<div className="p-4 text-sm text-muted-foreground">
											Loading PDF…
										</div>
									);
								}

								return (
									<Viewport
										documentId={activeDocumentId}
										className="h-full w-full bg-muted/20"
									>
										<Scroller
											documentId={activeDocumentId}
											renderPage={({ width, height, pageIndex }) => (
												<div
													className="mx-auto my-4 overflow-hidden rounded-md bg-background shadow"
													style={{ width, height }}
												>
													<RenderLayer
														documentId={activeDocumentId}
														pageIndex={pageIndex}
													/>
												</div>
											)}
										/>
									</Viewport>
								);
							}}
						</DocumentContent>
					)
				}
			</EmbedPDF>
		</div>
	);
}

