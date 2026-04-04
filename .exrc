" PropertyForSale Neovim Project Configuration
" Leader key shortcuts under <leader>p

" Ensure which-key is loaded for descriptions
lua << EOF
local ok, wk = pcall(require, "which-key")
if ok then
  wk.register({
    p = {
      name = "PropertyForSale",
      -- Development
      d = { ":!nix run .#dev<CR>", "Start dev services" },
      b = { ":!cd backend && air<CR>", "Start backend (hot reload)" },
      f = { ":!cd frontend && npm run dev<CR>", "Start frontend" },

      -- Building
      B = { ":!nix run .#build<CR>", "Build production" },

      -- Testing
      t = { ":!cd backend && go test ./...<CR>", "Run backend tests" },
      T = { ":!cd frontend && npm test<CR>", "Run frontend tests" },
      a = { ":!nix run .#test<CR>", "Run all tests" },

      -- Linting
      l = { ":!nix run .#lint<CR>", "Run all linters" },
      g = { ":!cd backend && golangci-lint run<CR>", "Go lint" },
      e = { ":!cd frontend && npm run lint<CR>", "ESLint" },

      -- Database
      m = { ":!nix run .#migrate up<CR>", "Run migrations up" },
      M = { ":!nix run .#migrate down<CR>", "Run migrations down" },

      -- Documentation
      o = { ":!nix run .#docs<CR>", "Serve documentation" },

      -- Git
      s = { ":!git status<CR>", "Git status" },
      c = { ":!git add -A && git commit<CR>", "Git commit" },

      -- Code navigation
      r = { ":e backend/internal/router/router.go<CR>", "Open router" },
      h = { ":e backend/internal/handler/<CR>", "Open handlers" },
      v = { ":e backend/internal/service/<CR>", "Open services" },
    },
  }, { prefix = "<leader>" })
end
EOF

" Go-specific settings
autocmd FileType go setlocal tabstop=4 shiftwidth=4 noexpandtab

" TypeScript/React settings
autocmd FileType typescript,typescriptreact setlocal tabstop=2 shiftwidth=2 expandtab

" Auto-format on save for Go files
autocmd BufWritePre *.go lua vim.lsp.buf.format()
