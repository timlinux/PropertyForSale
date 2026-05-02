// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package ziputil

import (
	"archive/zip"
	"bufio"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// SceneLimits defines safety limits for ZIP extraction
var SceneLimits = struct {
	MaxZipSize       int64 // Maximum ZIP file size (50 MB)
	MaxExtractedSize int64 // Maximum total extracted size (100 MB)
	MaxFileCount     int   // Maximum number of files
	MaxFileSize      int64 // Maximum size per file (20 MB)
	MaxPathDepth     int   // Maximum directory depth
}{
	MaxZipSize:       50 * 1024 * 1024,
	MaxExtractedSize: 100 * 1024 * 1024,
	MaxFileCount:     500,
	MaxFileSize:      20 * 1024 * 1024,
	MaxPathDepth:     10,
}

// AllowedExtensions whitelist of allowed file extensions for QGIS scenes
var AllowedExtensions = map[string]bool{
	// HTML/Web
	".html": true, ".htm": true, ".js": true, ".json": true, ".css": true,
	// Images
	".png": true, ".jpg": true, ".jpeg": true, ".gif": true, ".webp": true, ".svg": true,
	".ico": true, ".cur": true, ".bmp": true, ".tif": true, ".tiff": true,
	// 3D Models
	".gltf": true, ".glb": true, ".obj": true, ".mtl": true, ".bin": true,
	".dae": true, ".fbx": true, ".stl": true, ".ply": true,
	// Fonts
	".woff": true, ".woff2": true, ".ttf": true, ".eot": true, ".otf": true,
	// Data files
	".txt": true, ".xml": true, ".kml": true, ".geojson": true, ".csv": true,
	".prj": true, ".cpg": true, ".dbf": true, ".shp": true, ".shx": true,
	// Textures
	".dds": true, ".ktx": true, ".basis": true, ".exr": true, ".hdr": true,
	// Source maps and misc
	".map": true, ".md": true, ".license": true,
	// No extension files are allowed (handled separately)
	"": true,
}

// DangerousPatterns that could indicate XSS or malicious content
// Note: These are only flagged if NOT in a safe context (THREE.js, Q3D, etc.)
var DangerousPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)document\.cookie`),         // Cookie access
	regexp.MustCompile(`(?i)parent\.document`),         // Parent frame access
	regexp.MustCompile(`(?i)top\.document`),            // Top frame access
	regexp.MustCompile(`(?i)window\.opener`),           // Opener access
	regexp.MustCompile(`(?i)<script[^>]+src=["']http`), // External scripts (http, not https)
	regexp.MustCompile(`(?i)<iframe[^>]+src=["']http`), // External iframes
	// Removed: eval, Function, innerHTML, outerHTML, document.write - too many false positives with THREE.js
}

// SafePatterns that are expected in Qgis2threejs exports (used to reduce false positives)
var SafePatterns = []string{
	"THREE", "Q3D", "Qgis2threejs", "proj4", "potree",
	"OrbitControls", "WebGLRenderer", "Scene", "PerspectiveCamera",
	"three.js", "three.min.js", "BufferGeometry", "Material",
	"Mesh", "Object3D", "Vector3", "Matrix4", "Quaternion",
}

// ZIPAnalysisResult contains the result of analyzing a ZIP file
type ZIPAnalysisResult struct {
	IsValid          bool
	FileCount        int
	TotalSize        int64
	ExtractedSize    int64
	HasSymlinks      bool
	DisallowedFiles  []string
	DangerousContent []string
	Errors           []string
}

// AnalyzeZIP pre-scans a ZIP file for safety issues without extracting
func AnalyzeZIP(zipPath string) (*ZIPAnalysisResult, error) {
	result := &ZIPAnalysisResult{IsValid: true}

	// Check file size first
	info, err := os.Stat(zipPath)
	if err != nil {
		return nil, fmt.Errorf("failed to stat zip file: %w", err)
	}

	result.TotalSize = info.Size()
	if result.TotalSize > SceneLimits.MaxZipSize {
		result.IsValid = false
		result.Errors = append(result.Errors, fmt.Sprintf("ZIP file exceeds maximum size of %d MB", SceneLimits.MaxZipSize/(1024*1024)))
		return result, nil
	}

	// Open the ZIP file
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open zip file: %w", err)
	}
	defer r.Close()

	result.FileCount = len(r.File)
	if result.FileCount > SceneLimits.MaxFileCount {
		result.IsValid = false
		result.Errors = append(result.Errors, fmt.Sprintf("ZIP contains too many files (%d, max %d)", result.FileCount, SceneLimits.MaxFileCount))
	}

	for _, f := range r.File {
		// Check for symlinks
		if f.Mode()&os.ModeSymlink != 0 {
			result.HasSymlinks = true
			result.IsValid = false
			result.Errors = append(result.Errors, "ZIP contains symlinks which are not allowed")
			continue
		}

		// Skip directories
		if f.FileInfo().IsDir() {
			continue
		}

		// Check path depth
		depth := strings.Count(f.Name, "/")
		if depth > SceneLimits.MaxPathDepth {
			result.IsValid = false
			result.Errors = append(result.Errors, fmt.Sprintf("path too deep: %s", f.Name))
			continue
		}

		// Check file extension - track but don't reject (we'll skip during extraction)
		ext := strings.ToLower(filepath.Ext(f.Name))
		if ext != "" && !AllowedExtensions[ext] {
			result.DisallowedFiles = append(result.DisallowedFiles, f.Name)
			// Note: We don't set IsValid = false here anymore
			// Disallowed files will be skipped during extraction
		}

		// Track extracted size
		result.ExtractedSize += int64(f.UncompressedSize64)

		// Check individual file size
		if int64(f.UncompressedSize64) > SceneLimits.MaxFileSize {
			result.IsValid = false
			result.Errors = append(result.Errors, fmt.Sprintf("file too large: %s (%d MB)", f.Name, f.UncompressedSize64/(1024*1024)))
		}
	}

	// Check total extracted size
	if result.ExtractedSize > SceneLimits.MaxExtractedSize {
		result.IsValid = false
		result.Errors = append(result.Errors, fmt.Sprintf("total extracted size exceeds limit (%d MB, max %d MB)", result.ExtractedSize/(1024*1024), SceneLimits.MaxExtractedSize/(1024*1024)))
	}

	// Note: Disallowed files are tracked but not treated as errors
	// They will be skipped during extraction

	return result, nil
}

// ExtractSafe extracts a ZIP file with security checks
func ExtractSafe(zipPath, targetDir string) error {
	// Analyze first
	analysis, err := AnalyzeZIP(zipPath)
	if err != nil {
		return err
	}

	if !analysis.IsValid {
		return fmt.Errorf("ZIP validation failed: %s", strings.Join(analysis.Errors, "; "))
	}

	// Open the ZIP file
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return fmt.Errorf("failed to open zip file: %w", err)
	}
	defer r.Close()

	// Create target directory
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return fmt.Errorf("failed to create target directory: %w", err)
	}

	// Extract only allowed files
	for _, f := range r.File {
		// Skip symlinks
		if f.Mode()&os.ModeSymlink != 0 {
			continue
		}

		// Skip disallowed extensions (but always allow directories)
		if !f.FileInfo().IsDir() {
			ext := strings.ToLower(filepath.Ext(f.Name))
			if ext != "" && !AllowedExtensions[ext] {
				continue
			}
		}

		if err := extractFileSafe(f, targetDir); err != nil {
			return err
		}
	}

	return nil
}

// extractFileSafe extracts a single file with additional safety checks
func extractFileSafe(f *zip.File, targetDir string) error {
	// Sanitize the file path to prevent path traversal attacks
	cleanName := filepath.Clean(f.Name)
	destPath := filepath.Join(targetDir, cleanName)

	// Check for path traversal
	if !strings.HasPrefix(destPath, filepath.Clean(targetDir)+string(os.PathSeparator)) {
		return fmt.Errorf("invalid file path: %s", f.Name)
	}

	// Handle directories
	if f.FileInfo().IsDir() {
		return os.MkdirAll(destPath, f.Mode())
	}

	// Create parent directories
	if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
		return fmt.Errorf("failed to create parent directory: %w", err)
	}

	// Open the file in the archive
	rc, err := f.Open()
	if err != nil {
		return fmt.Errorf("failed to open file in archive: %w", err)
	}
	defer rc.Close()

	// Create the destination file with limited permissions
	dest, err := os.OpenFile(destPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dest.Close()

	// Copy with size limit
	limitedReader := io.LimitReader(rc, SceneLimits.MaxFileSize+1)
	written, err := io.Copy(dest, limitedReader)
	if err != nil {
		return fmt.Errorf("failed to copy file contents: %w", err)
	}

	if written > SceneLimits.MaxFileSize {
		os.Remove(destPath)
		return fmt.Errorf("file exceeds size limit: %s", f.Name)
	}

	return nil
}

// ValidateSceneContent scans extracted HTML/JS files for potentially dangerous patterns
func ValidateSceneContent(dir string) ([]string, error) {
	var warnings []string

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		ext := strings.ToLower(filepath.Ext(path))
		if ext != ".html" && ext != ".htm" && ext != ".js" {
			return nil
		}

		// Scan the file for dangerous patterns
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		relPath, _ := filepath.Rel(dir, path)
		scanner := bufio.NewScanner(file)
		lineNum := 0

		for scanner.Scan() {
			lineNum++
			line := scanner.Text()

			for _, pattern := range DangerousPatterns {
				if pattern.MatchString(line) {
					// Check if it's in a safe context (Q3D, THREE, etc.)
					isSafe := false
					for _, safe := range SafePatterns {
						if strings.Contains(line, safe) {
							isSafe = true
							break
						}
					}

					if !isSafe {
						warnings = append(warnings, fmt.Sprintf("%s:%d: potentially unsafe pattern detected", relPath, lineNum))
					}
				}
			}
		}

		return scanner.Err()
	})

	return warnings, err
}

// QGISSceneFiles defines the required files for a valid QGIS Qgis2threejs export
var QGISSceneFiles = []string{
	"index.html",
}

// QGISOptionalFiles are files that may exist in a QGIS export
var QGISOptionalFiles = []string{
	"Qgis2threejs.js",
	"Qgis2threejs.css",
	"Qgis2threejs.png",
}

// QGISSceneDirs defines directories that may exist in a QGIS export
var QGISSceneDirs = []string{
	"data",
	"threejs",
}

// Extract extracts a ZIP file to the target directory (uses ExtractSafe internally)
func Extract(zipPath, targetDir string) error {
	return ExtractSafe(zipPath, targetDir)
}

// ValidateQGISScene validates that the extracted directory contains a valid QGIS scene
func ValidateQGISScene(dir string) error {
	// Check for required files
	for _, file := range QGISSceneFiles {
		path := filepath.Join(dir, file)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			return fmt.Errorf("missing required file: %s", file)
		}
	}

	// Check if at least the data directory exists (standard QGIS export)
	// or if threejs directory exists (for scenes with external three.js)
	hasDataDir := false
	hasThreejsDir := false

	for _, d := range QGISSceneDirs {
		path := filepath.Join(dir, d)
		if info, err := os.Stat(path); err == nil && info.IsDir() {
			if d == "data" {
				hasDataDir = true
			}
			if d == "threejs" {
				hasThreejsDir = true
			}
		}
	}

	// Valid if it has data directory OR threejs directory
	if !hasDataDir && !hasThreejsDir {
		return fmt.Errorf("missing required directory: data or threejs")
	}

	return nil
}

// FindRootDirectory finds the root directory of the QGIS scene within extracted content
// Some ZIP files may have all content inside a subdirectory
func FindRootDirectory(dir string) (string, error) {
	// First check if index.html exists in the root
	if _, err := os.Stat(filepath.Join(dir, "index.html")); err == nil {
		return dir, nil
	}

	// Check subdirectories (one level deep)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return "", fmt.Errorf("failed to read directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			subdir := filepath.Join(dir, entry.Name())
			if _, err := os.Stat(filepath.Join(subdir, "index.html")); err == nil {
				return subdir, nil
			}
		}
	}

	return "", fmt.Errorf("could not find index.html in extracted content")
}
