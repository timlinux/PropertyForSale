// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package ziputil

import (
	"archive/zip"
	"os"
	"path/filepath"
	"testing"
)

func createTestZIP(t *testing.T, files map[string]string) string {
	t.Helper()
	tmpFile, err := os.CreateTemp("", "test-*.zip")
	if err != nil {
		t.Fatal(err)
	}
	defer tmpFile.Close()

	w := zip.NewWriter(tmpFile)
	for name, content := range files {
		f, err := w.Create(name)
		if err != nil {
			t.Fatal(err)
		}
		_, err = f.Write([]byte(content))
		if err != nil {
			t.Fatal(err)
		}
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return tmpFile.Name()
}

func TestAnalyzeZIP_ValidScene(t *testing.T) {
	files := map[string]string{
		"index.html":        "<html><body>Test</body></html>",
		"Qgis2threejs.js":   "var Q3D = {};",
		"data/scene.json":   "{}",
		"threejs/three.js":  "// THREE.js",
	}
	zipPath := createTestZIP(t, files)
	defer os.Remove(zipPath)

	result, err := AnalyzeZIP(zipPath)
	if err != nil {
		t.Fatalf("AnalyzeZIP failed: %v", err)
	}

	if !result.IsValid {
		t.Errorf("Expected valid ZIP, got errors: %v", result.Errors)
	}

	if result.FileCount != 4 {
		t.Errorf("Expected 4 files, got %d", result.FileCount)
	}
}

func TestAnalyzeZIP_DisallowedExtensions(t *testing.T) {
	files := map[string]string{
		"index.html":    "<html></html>",
		"malicious.exe": "binary content",
		"script.sh":     "#!/bin/bash",
	}
	zipPath := createTestZIP(t, files)
	defer os.Remove(zipPath)

	result, err := AnalyzeZIP(zipPath)
	if err != nil {
		t.Fatalf("AnalyzeZIP failed: %v", err)
	}

	// Disallowed extensions are tracked but don't invalidate the ZIP
	// They will be skipped during extraction
	if !result.IsValid {
		t.Errorf("Expected valid ZIP (disallowed files are skipped, not rejected), got errors: %v", result.Errors)
	}

	if len(result.DisallowedFiles) != 2 {
		t.Errorf("Expected 2 disallowed files tracked, got %d", len(result.DisallowedFiles))
	}
}

func TestAnalyzeZIP_TooManyFiles(t *testing.T) {
	// Create a ZIP with more than the limit
	files := make(map[string]string)
	for i := 0; i < SceneLimits.MaxFileCount+10; i++ {
		files[filepath.Join("data", "file"+string(rune(i))+".json")] = "{}"
	}
	zipPath := createTestZIP(t, files)
	defer os.Remove(zipPath)

	result, err := AnalyzeZIP(zipPath)
	if err != nil {
		t.Fatalf("AnalyzeZIP failed: %v", err)
	}

	if result.IsValid {
		t.Error("Expected invalid ZIP due to too many files")
	}
}

func TestExtractSafe_ValidScene(t *testing.T) {
	files := map[string]string{
		"index.html":       "<html><body>Test Scene</body></html>",
		"Qgis2threejs.js":  "var Q3D = {};",
		"data/scene.json":  "{}",
		"threejs/three.js": "// THREE.js",
	}
	zipPath := createTestZIP(t, files)
	defer os.Remove(zipPath)

	targetDir, err := os.MkdirTemp("", "extract-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(targetDir)

	err = ExtractSafe(zipPath, targetDir)
	if err != nil {
		t.Fatalf("ExtractSafe failed: %v", err)
	}

	// Verify files exist
	if _, err := os.Stat(filepath.Join(targetDir, "index.html")); os.IsNotExist(err) {
		t.Error("index.html not extracted")
	}
	if _, err := os.Stat(filepath.Join(targetDir, "data", "scene.json")); os.IsNotExist(err) {
		t.Error("data/scene.json not extracted")
	}
}

func TestExtractSafe_SkipsDisallowed(t *testing.T) {
	files := map[string]string{
		"index.html":    "<html></html>",
		"malicious.exe": "binary content",
	}
	zipPath := createTestZIP(t, files)
	defer os.Remove(zipPath)

	targetDir, err := os.MkdirTemp("", "extract-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(targetDir)

	// Extraction should succeed, but skip the disallowed file
	err = ExtractSafe(zipPath, targetDir)
	if err != nil {
		t.Fatalf("Expected extraction to succeed (skipping disallowed files), got error: %v", err)
	}

	// index.html should be extracted
	if _, err := os.Stat(filepath.Join(targetDir, "index.html")); os.IsNotExist(err) {
		t.Error("index.html should have been extracted")
	}

	// malicious.exe should NOT be extracted
	if _, err := os.Stat(filepath.Join(targetDir, "malicious.exe")); !os.IsNotExist(err) {
		t.Error("malicious.exe should have been skipped during extraction")
	}
}

func TestValidateSceneContent_SafeContent(t *testing.T) {
	dir, err := os.MkdirTemp("", "content-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	// Create a safe HTML file
	htmlContent := `<!DOCTYPE html>
<html>
<head><title>Test Scene</title></head>
<body>
<script>
var Q3D = {};
Q3D.init = function() {
  var scene = new THREE.Scene();
};
</script>
</body>
</html>`
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte(htmlContent), 0644); err != nil {
		t.Fatal(err)
	}

	warnings, err := ValidateSceneContent(dir)
	if err != nil {
		t.Fatalf("ValidateSceneContent failed: %v", err)
	}

	if len(warnings) > 0 {
		t.Errorf("Expected no warnings for safe content, got: %v", warnings)
	}
}

func TestValidateSceneContent_DangerousPatterns(t *testing.T) {
	dir, err := os.MkdirTemp("", "content-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	// Create an HTML file with dangerous patterns
	htmlContent := `<!DOCTYPE html>
<html>
<body>
<script>
// This is dangerous
document.cookie = "stolen";
localStorage.setItem("key", "value");
</script>
</body>
</html>`
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte(htmlContent), 0644); err != nil {
		t.Fatal(err)
	}

	warnings, err := ValidateSceneContent(dir)
	if err != nil {
		t.Fatalf("ValidateSceneContent failed: %v", err)
	}

	if len(warnings) == 0 {
		t.Error("Expected warnings for dangerous content")
	}
}

func TestValidateQGISScene_ValidScene(t *testing.T) {
	dir, err := os.MkdirTemp("", "scene-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	// Create required files
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<html></html>"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(dir, "data"), 0755); err != nil {
		t.Fatal(err)
	}

	err = ValidateQGISScene(dir)
	if err != nil {
		t.Errorf("Expected valid QGIS scene, got error: %v", err)
	}
}

func TestValidateQGISScene_MissingIndex(t *testing.T) {
	dir, err := os.MkdirTemp("", "scene-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	// Create data dir but no index.html
	if err := os.MkdirAll(filepath.Join(dir, "data"), 0755); err != nil {
		t.Fatal(err)
	}

	err = ValidateQGISScene(dir)
	if err == nil {
		t.Error("Expected error for missing index.html")
	}
}

func TestValidateQGISScene_MissingDataDir(t *testing.T) {
	dir, err := os.MkdirTemp("", "scene-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	// Create index.html but no data directory
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<html></html>"), 0644); err != nil {
		t.Fatal(err)
	}

	err = ValidateQGISScene(dir)
	if err == nil {
		t.Error("Expected error for missing data directory")
	}
}

func TestFindRootDirectory_RootLevel(t *testing.T) {
	dir, err := os.MkdirTemp("", "root-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<html></html>"), 0644); err != nil {
		t.Fatal(err)
	}

	rootDir, err := FindRootDirectory(dir)
	if err != nil {
		t.Fatalf("FindRootDirectory failed: %v", err)
	}

	if rootDir != dir {
		t.Errorf("Expected root dir to be %s, got %s", dir, rootDir)
	}
}

func TestFindRootDirectory_Subdirectory(t *testing.T) {
	dir, err := os.MkdirTemp("", "root-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	// Create index.html in a subdirectory
	subdir := filepath.Join(dir, "exported_scene")
	if err := os.MkdirAll(subdir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(subdir, "index.html"), []byte("<html></html>"), 0644); err != nil {
		t.Fatal(err)
	}

	rootDir, err := FindRootDirectory(dir)
	if err != nil {
		t.Fatalf("FindRootDirectory failed: %v", err)
	}

	if rootDir != subdir {
		t.Errorf("Expected root dir to be %s, got %s", subdir, rootDir)
	}
}

func TestAllowedExtensions(t *testing.T) {
	// Test that common Qgis2threejs file types are allowed
	expectedAllowed := []string{
		".html", ".js", ".json", ".css",
		".png", ".jpg", ".jpeg", ".gif",
		".gltf", ".glb", ".bin",
		".woff", ".woff2", ".ttf",
	}

	for _, ext := range expectedAllowed {
		if !AllowedExtensions[ext] {
			t.Errorf("Expected extension %s to be allowed", ext)
		}
	}

	// Test that dangerous extensions are not allowed
	expectedDisallowed := []string{
		".exe", ".sh", ".bat", ".cmd", ".ps1",
		".php", ".py", ".rb", ".pl",
	}

	for _, ext := range expectedDisallowed {
		if AllowedExtensions[ext] {
			t.Errorf("Expected extension %s to be disallowed", ext)
		}
	}
}
