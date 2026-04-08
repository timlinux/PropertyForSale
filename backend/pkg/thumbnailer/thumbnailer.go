// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package thumbnailer

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// VideoMetadata contains extracted video information
type VideoMetadata struct {
	Duration float64 // Duration in seconds
	Width    int
	Height   int
}

// Thumbnailer generates thumbnails from video files using FFmpeg
type Thumbnailer struct {
	ffmpegPath  string
	ffprobePath string
}

// New creates a new Thumbnailer instance
func New() (*Thumbnailer, error) {
	// Find ffmpeg and ffprobe in PATH
	ffmpegPath, err := exec.LookPath("ffmpeg")
	if err != nil {
		return nil, fmt.Errorf("ffmpeg not found in PATH: %w", err)
	}

	ffprobePath, err := exec.LookPath("ffprobe")
	if err != nil {
		return nil, fmt.Errorf("ffprobe not found in PATH: %w", err)
	}

	return &Thumbnailer{
		ffmpegPath:  ffmpegPath,
		ffprobePath: ffprobePath,
	}, nil
}

// GenerateVideoThumbnail extracts a frame from a video file and saves it as a JPEG thumbnail
// Returns the path to the generated thumbnail
func (t *Thumbnailer) GenerateVideoThumbnail(ctx context.Context, videoPath string, outputPath string) error {
	// Ensure output directory exists
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return fmt.Errorf("failed to create thumbnail directory: %w", err)
	}

	// Get video duration to determine thumbnail timestamp
	meta, err := t.GetVideoMetadata(ctx, videoPath)
	if err != nil {
		// If we can't get metadata, try to extract at 0 seconds
		meta = &VideoMetadata{Duration: 0}
	}

	// Extract frame at 10% into the video (or 2 seconds, whichever is less)
	// This usually gives a better representative frame than the very first frame
	timestamp := 2.0
	if meta.Duration > 0 {
		tenPercent := meta.Duration * 0.1
		if tenPercent < timestamp {
			timestamp = tenPercent
		}
		if timestamp > meta.Duration {
			timestamp = 0
		}
	}

	// Build FFmpeg command
	// -ss before -i for fast seeking
	// -vframes 1 to extract only one frame
	// -q:v 2 for high quality JPEG (scale 2-31, lower is better)
	args := []string{
		"-ss", fmt.Sprintf("%.2f", timestamp),
		"-i", videoPath,
		"-vframes", "1",
		"-q:v", "2",
		"-vf", "scale=640:-1", // Scale to 640px width, maintain aspect ratio
		"-y", // Overwrite output file if exists
		outputPath,
	}

	cmd := exec.CommandContext(ctx, t.ffmpegPath, args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg failed: %w, output: %s", err, string(output))
	}

	// Verify the thumbnail was created
	if _, err := os.Stat(outputPath); os.IsNotExist(err) {
		return fmt.Errorf("thumbnail was not created at %s", outputPath)
	}

	return nil
}

// GetVideoMetadata extracts metadata from a video file using ffprobe
func (t *Thumbnailer) GetVideoMetadata(ctx context.Context, videoPath string) (*VideoMetadata, error) {
	// Create context with timeout
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// Get duration
	durationArgs := []string{
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		videoPath,
	}

	durationCmd := exec.CommandContext(ctx, t.ffprobePath, durationArgs...)
	durationOutput, err := durationCmd.Output()
	if err != nil {
		return nil, fmt.Errorf("ffprobe duration failed: %w", err)
	}

	duration, _ := strconv.ParseFloat(strings.TrimSpace(string(durationOutput)), 64)

	// Get video dimensions
	dimensionArgs := []string{
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "stream=width,height",
		"-of", "csv=s=x:p=0",
		videoPath,
	}

	dimensionCmd := exec.CommandContext(ctx, t.ffprobePath, dimensionArgs...)
	dimensionOutput, err := dimensionCmd.Output()
	if err != nil {
		return nil, fmt.Errorf("ffprobe dimensions failed: %w", err)
	}

	var width, height int
	parts := strings.Split(strings.TrimSpace(string(dimensionOutput)), "x")
	if len(parts) == 2 {
		width, _ = strconv.Atoi(parts[0])
		height, _ = strconv.Atoi(parts[1])
	}

	return &VideoMetadata{
		Duration: duration,
		Width:    width,
		Height:   height,
	}, nil
}

// IsVideoFile checks if a MIME type indicates a video file
func IsVideoFile(mimeType string) bool {
	return strings.HasPrefix(mimeType, "video/")
}
