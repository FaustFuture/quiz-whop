"use client";

import { useState, useEffect, useRef } from "react";
import {
	ChevronLeft,
	ChevronRight,
	Edit,
	Trash2,
	MoreVertical,
	BookOpen,
	Check,
	X,
	Camera,
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { AddOptionDialog } from "@/components/add-option-dialog";
import { SortableOptionsList } from "@/components/sortable-options-list";
import { type Exercise } from "@/app/actions/exercises";
import { type Alternative } from "@/app/actions/alternatives";
import {
	deleteExercise,
	updateExercise,
	updateExerciseImageDisplaySize,
	updateExerciseImageLayout,
} from "@/app/actions/exercises";
import { uploadImageToStorage } from "@/app/actions/storage";
import { useRouter } from "next/navigation";

interface ExerciseCardProps {
	exercises: Exercise[];
	currentIndex: number;
	moduleId: string;
	alternatives: Alternative[];
	onNavigatePrevious?: () => void;
	onNavigateNext?: () => void;
	onExerciseDeleted?: () => void;
	hasPrevious?: boolean;
	hasNext?: boolean;
	isLoading?: boolean;
}

export function ExerciseCard({
	exercises,
	currentIndex,
	moduleId,
	alternatives,
	onNavigatePrevious,
	onNavigateNext,
	onExerciseDeleted,
	hasPrevious = false,
	hasNext = false,
	isLoading = false,
}: ExerciseCardProps) {
	const currentExercise = exercises[currentIndex];
	const [isDeleting, setIsDeleting] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editedQuestion, setEditedQuestion] = useState("");
	const [imageSize, setImageSize] = useState<
		"aspect-ratio" | "large" | "medium" | "small"
	>(
		(currentExercise.image_display_size as
			| "aspect-ratio"
			| "large"
			| "medium"
			| "small") || "aspect-ratio"
	);
	const [imageLayout, setImageLayout] = useState<
		"grid" | "carousel" | "vertical" | "horizontal"
	>(() => {
		if (currentExercise.image_layout) return currentExercise.image_layout;
		// Set default based on number of images
		const imageCount = currentExercise.image_urls?.length || 0;
		if (imageCount === 2) return "horizontal";
		if (imageCount === 3) return "carousel";
		if (imageCount === 4) return "grid";
		return "grid";
	});
	const [isUploading, setIsUploading] = useState(false);
	const [isUploadingVideo, setIsUploadingVideo] = useState(false);
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const router = useRouter();
	const [mediaType, setMediaType] = useState<"none" | "image" | "video">(
		(currentExercise as any).video_url
			? "video"
			: currentExercise.image_url
				? "image"
				: "none"
	);

	// Update image size when exercise changes
	useEffect(() => {
		setImageSize(
			(currentExercise.image_display_size as
				| "aspect-ratio"
				| "large"
				| "medium"
				| "small") || "aspect-ratio"
		);
	}, [currentExercise.image_display_size, currentIndex]);

	// Update image layout when exercise changes
	useEffect(() => {
		if (currentExercise.image_layout) {
			setImageLayout(currentExercise.image_layout);
		} else {
			// Set default based on number of images
			const imageCount = currentExercise.image_urls?.length || 0;
			if (imageCount === 2) setImageLayout("horizontal");
			else if (imageCount === 3) setImageLayout("carousel");
			else if (imageCount === 4) setImageLayout("grid");
			else setImageLayout("grid");
		}
	}, [currentExercise.image_layout, currentExercise.image_urls, currentIndex]);

	// Update media type when exercise changes
	useEffect(() => {
		setMediaType(
			(currentExercise as any).video_url
				? "video"
				: currentExercise.image_url
					? "image"
					: "none"
		);
	}, [currentIndex, currentExercise.id]);

	// Reset edit state when navigating to a different exercise
	useEffect(() => {
		setIsEditing(false);
		setEditedQuestion("");
	}, [currentIndex, currentExercise.id]);

	const getImageHeightClass = () => {
		switch (imageSize) {
			case "large":
				return "h-[50vh]";
			case "medium":
				return "h-[35vh]";
			case "small":
				return "h-[25vh]";
			case "aspect-ratio":
			default:
				return "h-auto";
		}
	};

	const handleVideoChange = async (videoUrl: string) => {
		try {
			const result = await updateExercise(currentExercise.id, moduleId, {
				video_url: videoUrl,
			});
			if (result.success) {
				router.refresh();
			} else {
				console.error("Failed to update video:", result.error);
				alert("Failed to update video. Please try again.");
			}
		} catch (error) {
			console.error("Error updating video:", error);
			alert("An error occurred while updating the video. Please try again.");
		}
	};

	const handleMediaTypeChange = async (value: "none" | "image" | "video") => {
		setMediaType(value);
		try {
			if (value === "image") {
				await updateExercise(currentExercise.id, moduleId, { video_url: "" });
			} else if (value === "video") {
				await updateExercise(currentExercise.id, moduleId, {
					image_url: "",
					image_urls: [],
				});
			} else {
				await updateExercise(currentExercise.id, moduleId, {
					image_url: "",
					image_urls: [],
					video_url: "",
				});
			}
		} catch (e) {
			console.error("Failed to change media type", e);
			alert("Failed to change media type. Please try again.");
		}
	};

	const handleEditStart = () => {
		setEditedQuestion(currentExercise.question);
		setIsEditing(true);
	};

	const handleEditSave = async () => {
		if (!editedQuestion.trim()) {
			return;
		}

		try {
			const result = await updateExercise(currentExercise.id, moduleId, {
				question: editedQuestion,
			});

			if (result.success) {
				setIsEditing(false);
				router.refresh();
			} else {
				console.error("Failed to save question:", result.error);
				alert("Failed to save question. Please try again.");
			}
		} catch (error) {
			console.error("Error saving question:", error);
			alert("An error occurred while saving. Please try again.");
		}
	};

	const handleEditCancel = () => {
		setEditedQuestion("");
		setIsEditing(false);
	};

	const handleImageChange = async (imageUrl: string) => {
		try {
			const result = await updateExercise(currentExercise.id, moduleId, {
				image_url: imageUrl,
			});

			if (result.success) {
				router.refresh();
			} else {
				console.error("Failed to update image:", result.error);
				alert("Failed to update image. Please try again.");
			}
		} catch (error) {
			console.error("Error updating image:", error);
			alert("An error occurred while updating the image. Please try again.");
		}
	};

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = Array.from(event.target.files || []);
		const imageFiles = files
			.filter((f) => f.type.startsWith("image/"))
			.slice(0, 4);
		if (imageFiles.length === 0) return;

		// Validate sizes (5MB per image)
		if (imageFiles.some((f) => f.size > 5 * 1024 * 1024)) {
			alert("Each image must be less than 5MB.");
			return;
		}

		setIsUploading(true);
		try {
			const urls: string[] = [];
			for (const f of imageFiles) {
				const result = await uploadImageToStorage(f);
				if (result.success && result.url) urls.push(result.url);
			}
			if (urls.length > 0) {
				await updateExercise(currentExercise.id, moduleId, {
					image_url: urls[0],
					image_urls: urls,
				});
				// If exactly two images, default layout to horizontal automatically
				if (urls.length === 2) {
					try {
						await updateExerciseImageLayout(
							currentExercise.id,
							moduleId,
							"horizontal"
						);
					} catch { }
				}
				router.refresh();
			}
		} catch (error) {
			console.error("Error uploading images:", error);
			alert("An error occurred while uploading images. Please try again.");
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleImageClick = () => {
		if (isUploading) return;
		fileInputRef.current?.click();
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer.types.includes("Files")) {
			setIsDragOver(true);
		}
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);

		if (isUploading) return;

		const files = Array.from(e.dataTransfer.files);
		const imageFiles = files
			.filter((file) => file.type.startsWith("image/"))
			.slice(0, 4);

		if (imageFiles.length > 0) {
			const syntheticEvent = {
				target: { files: imageFiles },
			} as unknown as React.ChangeEvent<HTMLInputElement>;
			await handleFileUpload(syntheticEvent);
		} else {
			alert("Please drop image files.");
		}
	};

	const uploadVideoFile = async (file: File) => {
		// 200MB limit to keep short clips
		if (file.size > 200 * 1024 * 1024) {
			alert("Video must be less than 200MB.");
			return;
		}
		setIsUploadingVideo(true);
		try {
			const res = await uploadImageToStorage(file, "images");
			if (res.success && res.url) {
				await handleVideoChange(res.url);
			} else {
				alert(res.error || "Upload failed");
			}
		} finally {
			setIsUploadingVideo(false);
		}
	};

	const handleImageSizeChange = async (
		newSize: "aspect-ratio" | "large" | "medium" | "small"
	) => {
		setImageSize(newSize);

		try {
			const result = await updateExerciseImageDisplaySize(
				currentExercise.id,
				moduleId,
				newSize
			);

			if (!result.success) {
				console.error("Failed to update image display size:", result.error);
				// Revert the state if the update failed
				setImageSize(
					(currentExercise.image_display_size as
						| "aspect-ratio"
						| "large"
						| "medium"
						| "small") || "aspect-ratio"
				);
				alert("Failed to save image size setting. Please try again.");
			}
		} catch (error) {
			console.error("Error updating image display size:", error);
			// Revert the state if the update failed
			setImageSize(
				(currentExercise.image_display_size as
					| "aspect-ratio"
					| "large"
					| "medium"
					| "small") || "aspect-ratio"
			);
			alert(
				"An error occurred while saving the image size setting. Please try again."
			);
		}
	};

	const handleImageLayoutChange = async (
		newLayout: "grid" | "carousel" | "vertical" | "horizontal"
	) => {
		setImageLayout(newLayout);

		try {
			const result = await updateExerciseImageLayout(
				currentExercise.id,
				moduleId,
				newLayout
			);

			if (!result.success) {
				console.error("Failed to update image layout:", result.error);
				// Revert the state if the update failed
				setImageLayout(currentExercise.image_layout || "grid");
				alert("Failed to save image layout setting. Please try again.");
			}
		} catch (error) {
			console.error("Error updating image layout:", error);
			// Revert the state if the update failed
			setImageLayout(currentExercise.image_layout || "grid");
			alert(
				"An error occurred while saving the image layout setting. Please try again."
			);
		}
	};

	const handleDelete = async () => {
		if (
			!confirm(
				"Are you sure you want to delete this exercise? This action cannot be undone."
			)
		) {
			return;
		}

		setIsDeleting(true);

		try {
			const result = await deleteExercise(currentExercise.id, moduleId);

			if (result.success) {
				// Call the callback to handle navigation logic
				if (onExerciseDeleted) {
					onExerciseDeleted();
				} else {
					// Fallback to refresh if no callback provided
					router.refresh();
				}
			} else {
				console.error("Failed to delete exercise:", result.error);
				alert("Failed to delete exercise. Please try again.");
			}
		} catch (error) {
			console.error("Error deleting exercise:", error);
			alert("An error occurred. Please try again.");
		} finally {
			setIsDeleting(false);
		}
	};

	if (!currentExercise) {
		return null;
	}

	return (
		<div className="flex items-center justify-center gap-2 sm:gap-4">
			{/* Previous Button */}
			<Button
				variant="outline"
				size="icon"
				onClick={onNavigatePrevious}
				disabled={!hasPrevious}
				className="shrink-0 border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-accent hover:border-emerald-500 min-h-[44px] min-w-[44px] hidden sm:flex"
			>
				<ChevronLeft className="h-4 w-4" />
			</Button>

			{/* Exercise Card */}
			<Card className="min-h-[400px] w-full max-w-2xl border-border bg-card mx-auto">
				<CardHeader className="pb-3 sm:pb-5 p-4 sm:p-6">
					{/* Media Type Selector */}
					<div className="mb-4 sm:mb-6">
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
							<label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
								Media Type:
							</label>
							<Select
								value={mediaType}
								onValueChange={(v) => handleMediaTypeChange(v as any)}
							>
								<SelectTrigger className="w-full sm:w-40 bg-muted border-border text-foreground text-xs sm:text-sm min-h-[44px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-muted border-border">
									<SelectItem
										value="none"
										className="text-foreground focus:bg-accent min-h-[44px]"
									>
										None
									</SelectItem>
									<SelectItem
										value="image"
										className="text-foreground focus:bg-accent min-h-[44px]"
									>
										Image
									</SelectItem>
									<SelectItem
										value="video"
										className="text-foreground focus:bg-accent min-h-[44px]"
									>
										Video
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Video (optional) */}
					{mediaType === "video" && (currentExercise as any).video_url && (
						<div className="relative w-full mb-6 sm:mb-12 rounded-lg overflow-hidden border border-border bg-black">
							{/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(
								currentExercise.video_url || ""
							) ? (
								<iframe
									src={`https://www.youtube.com/embed/${(() => {
										const m = (currentExercise.video_url || "").match(
											/(?:v=|youtu\.be\/)([^&/?#]+)/
										);
										return m ? m[1] : "";
									})()}`}
									className="w-full aspect-video"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowFullScreen
								/>
							) : /^https?:\/\/(www\.)?vimeo\.com\//.test(
								currentExercise.video_url || ""
							) ? (
								<iframe
									src={(currentExercise.video_url as string).replace(
										"vimeo.com",
										"player.vimeo.com/video"
									)}
									className="w-full aspect-video"
									allow="autoplay; fullscreen; picture-in-picture"
									allowFullScreen
								/>
							) : (
								<video controls className="w-full aspect-video">
									<source src={currentExercise.video_url || ""} />
								</video>
							)}
						</div>
					)}
					{/* Clickable Image - Full Width with Adjusted Height */}
					{mediaType === "image" && (
						<div
							className={`w-full bg-muted border border-border rounded-lg cursor-pointer hover:bg-accent group relative mb-4 sm:mb-8 overflow-hidden touch-manipulation ${isDragOver ? "border-emerald-500 bg-emerald-500/10" : ""
								}`}
							onClick={handleImageClick}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
						>
							{(() => {
								const imgs: string[] =
									(currentExercise as any).image_urls &&
										(currentExercise as any).image_urls.length > 0
										? (currentExercise as any).image_urls.slice(0, 4)
										: currentExercise.image_url
											? [currentExercise.image_url]
											: [];

								console.log("Images to display:", imgs, "Length:", imgs.length);
								console.log(
									"image_urls from exercise:",
									(currentExercise as any).image_urls
								);
								console.log(
									"image_url from exercise:",
									currentExercise.image_url
								);

								if (imgs.length === 0) {
									return (
										<div className="w-full h-32 sm:h-40 flex items-center justify-center">
											{isUploading ? (
												<div className="flex flex-col items-center gap-2">
													<div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
													<span className="text-xs sm:text-sm text-gray-400">
														Uploading...
													</span>
												</div>
											) : isDragOver ? (
												<div className="flex flex-col items-center gap-2">
													<Camera className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-500" />
													<span className="text-xs sm:text-sm text-emerald-500 font-medium text-center px-2">
														Drop images here
													</span>
												</div>
											) : (
												<div className="flex flex-col items-center gap-2">
													<Camera className="w-8 h-8 sm:w-12 sm:h-12 text-gray-600" />
													<span className="text-xs sm:text-sm text-gray-400 text-center px-2">
														Click or drag up to 4 images here
													</span>
												</div>
											)}
										</div>
									);
								}

								if (imgs.length === 1) {
									return (
										<div className={`w-full ${getImageHeightClass()} relative`}>
											<img
												src={imgs[0]}
												alt="Exercise image"
												className={`w-full ${getImageHeightClass()} object-cover rounded-lg`}
												onError={(e) => {
													console.error(
														"Failed to load single image:",
														imgs[0]
													);
													e.currentTarget.style.display = "none";
													e.currentTarget.nextElementSibling?.classList.remove(
														"hidden"
													);
												}}
											/>
											<div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-bold rounded">
												1
											</div>
											<div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
												<Camera className="w-12 h-12 text-gray-600" />
												<span className="text-sm text-gray-400 ml-2">
													Image failed to load
												</span>
											</div>
										</div>
									);
								}

								// Render images based on selected layout
								const layout =
									currentExercise.image_layout ||
									(imgs.length === 2
										? "horizontal"
										: imgs.length === 3
											? "carousel"
											: "grid");

								if (imgs.length === 2) {
									if (layout === "vertical") {
										return (
											<div className="p-1.5 sm:p-3 h-full">
												<div className="grid grid-cols-1 gap-1.5 sm:gap-3 h-full">
													{imgs.map((u, i) => (
														<div
															key={i}
															className="relative w-full h-full bg-gray-100 rounded"
														>
															<img
																src={u}
																alt={`Exercise ${i + 1}`}
																className="w-full h-full object-cover rounded"
																onError={(e) => {
																	console.error(
																		`Failed to load image ${i + 1}:`,
																		u
																	);
																	e.currentTarget.style.display = "none";
																	e.currentTarget.nextElementSibling?.classList.remove(
																		"hidden"
																	);
																}}
															/>
															<div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
																{i + 1}
															</div>
															<div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200 rounded">
																<Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
															</div>
														</div>
													))}
												</div>
											</div>
										);
									} else {
										// horizontal
										return (
											<div className="p-1.5 sm:p-3 h-full">
												<div className="grid grid-cols-2 gap-1.5 sm:gap-3 h-full">
													{imgs.map((u, i) => (
														<div
															key={i}
															className="relative w-full h-full bg-gray-100 rounded"
														>
															<img
																src={u}
																alt={`Exercise ${i + 1}`}
																className="w-full h-full object-cover rounded"
																onError={(e) => {
																	console.error(
																		`Failed to load image ${i + 1}:`,
																		u
																	);
																	e.currentTarget.style.display = "none";
																	e.currentTarget.nextElementSibling?.classList.remove(
																		"hidden"
																	);
																}}
															/>
															<div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
																{i + 1}
															</div>
															<div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200 rounded">
																<Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
															</div>
														</div>
													))}
												</div>
											</div>
										);
									}
								}

								if (imgs.length === 3) {
									return (
										<div className="p-1.5 sm:p-3 h-full">
											<div className="flex gap-2 sm:gap-4 h-full overflow-x-auto scrollbar-hide">
												{imgs.map((u, i) => (
													<div
														key={i}
														className="relative w-[280px] sm:w-80 h-full bg-gray-100 rounded flex-shrink-0"
													>
														<img
															src={u}
															alt={`Exercise ${i + 1}`}
															className="w-full h-full object-cover rounded"
															onError={(e) => {
																console.error(
																	`Failed to load image ${i + 1}:`,
																	u
																);
																e.currentTarget.style.display = "none";
																e.currentTarget.nextElementSibling?.classList.remove(
																	"hidden"
																);
															}}
														/>
														<div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
															{i + 1}
														</div>
														<div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200 rounded">
															<Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
														</div>
													</div>
												))}
											</div>
										</div>
									);
								}

								if (imgs.length === 4) {
									if (layout === "carousel") {
										return (
											<div className="p-1.5 sm:p-3 h-full">
												<div className="flex gap-2 sm:gap-4 h-full overflow-x-auto scrollbar-hide">
													{imgs.map((u, i) => (
														<div
															key={i}
															className="relative w-[280px] sm:w-80 h-full bg-gray-100 rounded flex-shrink-0"
														>
															<img
																src={u}
																alt={`Exercise ${i + 1}`}
																className="w-full h-full object-cover rounded"
																onError={(e) => {
																	console.error(
																		`Failed to load image ${i + 1}:`,
																		u
																	);
																	e.currentTarget.style.display = "none";
																	e.currentTarget.nextElementSibling?.classList.remove(
																		"hidden"
																	);
																}}
															/>
															<div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
																{i + 1}
															</div>
															<div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200 rounded">
																<Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
															</div>
														</div>
													))}
												</div>
											</div>
										);
									} else {
										// grid (2x2)
										return (
											<div className="p-1.5 sm:p-3 h-full">
												<div className="grid grid-cols-2 gap-1.5 sm:gap-3 h-full">
													{imgs.map((u, i) => (
														<div
															key={i}
															className="relative w-full h-full bg-gray-100 rounded"
														>
															<img
																src={u}
																alt={`Exercise ${i + 1}`}
																className="w-full h-full object-cover rounded"
																onError={(e) => {
																	console.error(
																		`Failed to load image ${i + 1}:`,
																		u
																	);
																	e.currentTarget.style.display = "none";
																	e.currentTarget.nextElementSibling?.classList.remove(
																		"hidden"
																	);
																}}
															/>
															<div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
																{i + 1}
															</div>
															<div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200 rounded">
																<Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
															</div>
														</div>
													))}
												</div>
											</div>
										);
									}
								}

								// Fallback to grid for any other number of images
								return (
									<div className="p-1.5 sm:p-3 h-full">
										<div className="grid grid-cols-2 gap-1.5 sm:gap-3 h-full">
											{imgs.map((u, i) => (
												<div
													key={i}
													className="relative w-full h-full bg-gray-100 rounded"
												>
													<img
														src={u}
														alt={`Exercise ${i + 1}`}
														className="w-full h-full object-cover rounded"
														onError={(e) => {
															console.error(
																`Failed to load image ${i + 1}:`,
																u
															);
															e.currentTarget.style.display = "none";
															e.currentTarget.nextElementSibling?.classList.remove(
																"hidden"
															);
														}}
													/>
													<div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
														{i + 1}
													</div>
													<div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200 rounded">
														<Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
													</div>
												</div>
											))}
										</div>
									</div>
								);
							})()}
							{/* Camera overlay on hover */}
							<div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100" />
						</div>
					)}

					{/* Image Size Selector - Only for single images */}
					{mediaType === "image" &&
						currentExercise.image_url &&
						(!currentExercise.image_urls ||
							currentExercise.image_urls.length <= 1) && (
							<div className="mb-6 sm:mb-10 mt-2 sm:mt-3">
								<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
									<label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
										Image Size:
									</label>
									<Select
										value={imageSize}
										onValueChange={handleImageSizeChange}
									>
										<SelectTrigger className="w-full sm:w-40 bg-muted border-border text-foreground text-xs sm:text-sm min-h-[44px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-muted border-border">
											<SelectItem
												value="aspect-ratio"
												className="text-foreground focus:bg-accent min-h-[44px]"
											>
												Original Size
											</SelectItem>
											<SelectItem
												value="large"
												className="text-foreground focus:bg-accent min-h-[44px]"
											>
												Large
											</SelectItem>
											<SelectItem
												value="medium"
												className="text-foreground focus:bg-accent min-h-[44px]"
											>
												Medium
											</SelectItem>
											<SelectItem
												value="small"
												className="text-foreground focus:bg-accent min-h-[44px]"
											>
												Small
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						)}

					{/* Image Layout Selector */}
					{mediaType === "image" &&
						currentExercise.image_urls &&
						currentExercise.image_urls.length > 1 &&
						currentExercise.image_urls.length !== 3 && (
							<div className="mb-6 sm:mb-10 mt-2 sm:mt-3">
								<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
									<label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
										Image Layout:
									</label>
									<Select
										value={imageLayout}
										onValueChange={handleImageLayoutChange}
									>
										<SelectTrigger className="w-full sm:w-48 bg-muted border-border text-foreground text-xs sm:text-sm min-h-[44px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-muted border-border">
											{currentExercise.image_urls.length === 2 && (
												<>
													<SelectItem
														value="vertical"
														className="text-foreground focus:bg-accent min-h-[44px]"
													>
														Vertical Stack
													</SelectItem>
													<SelectItem
														value="horizontal"
														className="text-foreground focus:bg-accent min-h-[44px]"
													>
														Horizontal Row
													</SelectItem>
												</>
											)}
											{currentExercise.image_urls.length === 4 && (
												<>
													<SelectItem
														value="grid"
														className="text-foreground focus:bg-accent min-h-[44px]"
													>
														Grid (2x2)
													</SelectItem>
													<SelectItem
														value="carousel"
														className="text-foreground focus:bg-accent min-h-[44px]"
													>
														Carousel
													</SelectItem>
												</>
											)}
										</SelectContent>
									</Select>
								</div>
							</div>
						)}

					{/* Video controls */}
					{mediaType === "video" && (
						<div className="mb-8 sm:mb-16 space-y-4 sm:space-y-8">
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-2">
								<label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">URL:</label>
								<Input
									key={currentExercise.id}
									placeholder="https://... (YouTube, Vimeo, or direct mp4)"
									defaultValue={currentExercise.video_url || ""}
									onBlur={async (e) => {
										const url = e.target.value.trim();
										if (url === (currentExercise.video_url || "")) return;
										await handleVideoChange(url || "");
									}}
									className="bg-background border border-border text-foreground placeholder:text-muted-foreground text-xs sm:text-sm min-h-[44px]"
								/>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										disabled={isUploadingVideo}
										onClick={() => {
											const inp = document.createElement("input");
											inp.type = "file";
											inp.accept = "video/*";
											inp.onchange = async (ev: any) => {
												const f = ev.target.files?.[0];
												if (!f) return;
												await uploadVideoFile(f);
											};
											inp.click();
										}}
										className="min-h-[44px] text-xs sm:text-sm flex-1 sm:flex-none"
									>
										{isUploadingVideo ? "Uploading..." : "Upload Video"}
									</Button>
									{currentExercise.video_url && (
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleVideoChange("")}
											className="min-h-[44px] text-xs sm:text-sm"
										>
											Remove
										</Button>
									)}
								</div>
							</div>
						</div>
					)}

					<div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 sm:gap-6 mt-8 sm:mt-16">
						<div className="flex-1 min-w-0">
							{/* Editable Question */}
							<div className="space-y-2">
								{isEditing ? (
									<div className="space-y-2">
										<Input
											value={editedQuestion}
											onChange={(e) => setEditedQuestion(e.target.value)}
											placeholder="Enter the question for this exercise..."
											className="text-sm sm:text-base bg-background border border-border focus-visible:border-emerald-500 text-foreground placeholder:text-muted-foreground min-h-[44px]"
											autoFocus
										/>
										{!editedQuestion.trim() && (
											<p className="text-xs text-red-400">
												Question title is required.
											</p>
										)}
										<div className="flex gap-2">
											<Button
												size="sm"
												onClick={handleEditSave}
												disabled={!editedQuestion.trim()}
												className="h-9 sm:h-8 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 min-h-[44px] sm:min-h-0 text-xs sm:text-sm"
											>
												<Check className="w-3 h-3 mr-1" />
												Save
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={handleEditCancel}
												className="h-9 sm:h-8 px-3 bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent min-h-[44px] sm:min-h-0 text-xs sm:text-sm"
											>
												<X className="w-3 h-3 mr-1" />
												Cancel
											</Button>
										</div>
									</div>
								) : (
									<CardDescription
										className="text-sm sm:text-base cursor-pointer p-2 sm:p-3 rounded text-muted-foreground border border-border bg-muted hover:bg-accent hover:border-emerald-500/50 touch-manipulation min-h-[44px] flex items-center break-words"
										onClick={handleEditStart}
									>
										{currentExercise.question ||
											"Add a question for this exercise..."}
									</CardDescription>
								)}
							</div>
							{!isEditing && !currentExercise.question?.trim() && (
								<p className="text-xs text-red-400 mt-1">
									Question title is required.
								</p>
							)}
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground hover:bg-accent min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
									disabled={isDeleting}
								>
									<MoreVertical className="h-4 w-4" />
									<span className="sr-only">Open menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="bg-muted border-border"
							>
								<DropdownMenuItem
									onClick={handleEditStart}
									className="text-muted-foreground focus:bg-accent focus:text-foreground min-h-[44px]"
								>
									<Edit className="mr-2 h-4 w-4" />
									Edit Question
								</DropdownMenuItem>
								<DropdownMenuItem
									className="text-red-500 focus:text-red-500 focus:bg-red-500/10 min-h-[44px]"
									onClick={handleDelete}
									disabled={isDeleting}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									{isDeleting ? "Deleting..." : "Delete"}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col h-full p-4 sm:p-6 pt-0">
					{/* Options Section */}
					<div className="flex-1 mb-4">
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
							<h4 className="text-xs sm:text-sm font-medium text-foreground">
								Options ({alternatives.length})
							</h4>
							<AddOptionDialog exerciseId={currentExercise.id} />
						</div>
						<SortableOptionsList
							alternatives={alternatives}
							exerciseId={currentExercise.id}
						/>
					</div>

					<div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-auto">
						<span>
							Created{" "}
							{new Date(currentExercise.created_at).toLocaleDateString()}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* Next Button */}
			<Button
				variant="outline"
				size="icon"
				onClick={onNavigateNext}
				disabled={!hasNext}
				className="shrink-0 border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-accent hover:border-emerald-500 min-h-[44px] min-w-[44px] hidden sm:flex"
			>
				<ChevronRight className="h-4 w-4" />
			</Button>

			{/* Hidden File Input */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				onChange={handleFileUpload}
				className="hidden"
			/>
		</div>
	);
}
