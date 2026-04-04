-- PropertyForSale Neovim Project Configuration
-- SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
-- SPDX-License-Identifier: EUPL-1.2

-- LSP configuration for this project
local lspconfig_ok, lspconfig = pcall(require, "lspconfig")
if lspconfig_ok then
  -- Go LSP
  lspconfig.gopls.setup({
    settings = {
      gopls = {
        analyses = {
          unusedparams = true,
          shadow = true,
        },
        staticcheck = true,
        gofumpt = true,
      },
    },
  })

  -- TypeScript LSP
  lspconfig.tsserver.setup({
    root_dir = lspconfig.util.root_pattern("frontend/package.json"),
  })
end

-- Project-specific keymaps
vim.api.nvim_create_autocmd("VimEnter", {
  callback = function()
    local wk_ok, wk = pcall(require, "which-key")
    if wk_ok then
      wk.register({
        p = {
          name = "PropertyForSale",
          d = { "<cmd>!nix run .#dev<cr>", "Start dev services" },
          b = { "<cmd>terminal cd backend && air<cr>", "Backend hot reload" },
          f = { "<cmd>terminal cd frontend && npm run dev<cr>", "Frontend dev" },
          B = { "<cmd>!nix run .#build<cr>", "Build production" },
          t = { "<cmd>terminal cd backend && go test ./...<cr>", "Backend tests" },
          T = { "<cmd>terminal cd frontend && npm test<cr>", "Frontend tests" },
          l = { "<cmd>!nix run .#lint<cr>", "Lint all" },
          m = { "<cmd>!nix run .#migrate up<cr>", "Migrate up" },
          o = { "<cmd>terminal nix run .#docs<cr>", "Serve docs" },
        },
      }, { prefix = "<leader>" })
    end
  end,
})

-- DAP (Debug Adapter Protocol) for Go
local dap_ok, dap = pcall(require, "dap")
if dap_ok then
  dap.adapters.go = {
    type = "server",
    port = "${port}",
    executable = {
      command = "dlv",
      args = { "dap", "-l", "127.0.0.1:${port}" },
    },
  }

  dap.configurations.go = {
    {
      type = "go",
      name = "Debug Backend",
      request = "launch",
      program = "${workspaceFolder}/backend/cmd/server",
    },
  }
end

-- Telescope project shortcuts
local telescope_ok, telescope = pcall(require, "telescope.builtin")
if telescope_ok then
  vim.keymap.set("n", "<leader>ph", function()
    telescope.find_files({ cwd = "backend/internal/handler" })
  end, { desc = "Find handlers" })

  vim.keymap.set("n", "<leader>ps", function()
    telescope.find_files({ cwd = "backend/internal/service" })
  end, { desc = "Find services" })

  vim.keymap.set("n", "<leader>pc", function()
    telescope.find_files({ cwd = "frontend/src/components" })
  end, { desc = "Find components" })
end

-- Auto-commands for this project
vim.api.nvim_create_autocmd("BufWritePre", {
  pattern = "*.go",
  callback = function()
    vim.lsp.buf.format({ async = false })
  end,
})

vim.api.nvim_create_autocmd("BufWritePre", {
  pattern = { "*.ts", "*.tsx" },
  callback = function()
    vim.lsp.buf.format({ async = false })
  end,
})
