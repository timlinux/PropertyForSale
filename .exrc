" PropertyForSale Neovim Project Configuration
" Leader key shortcuts under <leader>p

" Ensure which-key is loaded for descriptions (new spec format)
lua << EOF
local ok, wk = pcall(require, "which-key")
if ok then
  wk.add({
    { "<leader>p", group = "PropertyForSale" },
    -- Development
    { "<leader>pd", "<cmd>!nix run .#dev<cr>", desc = "Start dev services" },
    { "<leader>pb", "<cmd>terminal cd backend && air<cr>", desc = "Backend hot reload" },
    { "<leader>pf", "<cmd>terminal cd frontend && npm run dev<cr>", desc = "Frontend dev" },
    -- Building
    { "<leader>pB", "<cmd>!nix run .#build<cr>", desc = "Build production" },
    -- Testing
    { "<leader>pt", "<cmd>terminal cd backend && go test ./...<cr>", desc = "Backend tests" },
    { "<leader>pT", "<cmd>terminal cd frontend && npm test<cr>", desc = "Frontend tests" },
    { "<leader>pa", "<cmd>!nix run .#test<cr>", desc = "Run all tests" },
    -- Linting
    { "<leader>pl", "<cmd>!nix run .#lint<cr>", desc = "Lint all" },
    { "<leader>pg", "<cmd>terminal cd backend && golangci-lint run<cr>", desc = "Go lint" },
    { "<leader>pe", "<cmd>terminal cd frontend && npm run lint<cr>", desc = "ESLint" },
    -- Database
    { "<leader>pm", "<cmd>!nix run .#migrate up<cr>", desc = "Migrate up" },
    { "<leader>pM", "<cmd>!nix run .#migrate down<cr>", desc = "Migrate down" },
    -- Documentation
    { "<leader>po", "<cmd>terminal nix run .#docs<cr>", desc = "Serve docs" },
    -- Git
    { "<leader>ps", "<cmd>!git status<cr>", desc = "Git status" },
    { "<leader>pc", "<cmd>!git add -A && git commit<cr>", desc = "Git commit" },
    -- Code navigation
    { "<leader>pr", "<cmd>e backend/internal/router/router.go<cr>", desc = "Open router" },
    { "<leader>ph", "<cmd>e backend/internal/handler/<cr>", desc = "Open handlers" },
    { "<leader>pv", "<cmd>e backend/internal/service/<cr>", desc = "Open services" },
  })
end
EOF

" Go-specific settings
autocmd FileType go setlocal tabstop=4 shiftwidth=4 noexpandtab

" TypeScript/React settings
autocmd FileType typescript,typescriptreact setlocal tabstop=2 shiftwidth=2 expandtab

" Auto-format on save for Go files
autocmd BufWritePre *.go lua vim.lsp.buf.format()
