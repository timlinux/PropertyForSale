# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
#
# Example NixOS configuration for a PropertyForSale production server.
#
# This is a standalone deployment config. The module (imported by the flake's
# nixosModules.default) provides all PropertyForSale services.
#
# Deploy with: nix run .#deploy -- <server-ip>
#
# For integration into an existing NixOS config, see the module documentation
# or docs/admin-guide/nixos-deployment.md

{ config, pkgs, lib, ... }:

{
  imports = [
    ./hardware-configuration.nix
  ];

  # -- PropertyForSale service ------------------------------------------------
  services.propertyforsale = {
    enable = true;

    # Required: set your domain and ACME email
    domain = "propertyforsale.example.com";
    acmeEmail = "tim@kartoza.com";

    # Secrets (create these files on the server before first boot)
    envFile = "/var/lib/propertyforsale/.env";
    minio.credentialsFile = "/var/lib/minio/credentials";

    # All other options use sensible defaults. Override as needed:
    # port = 8080;
    # database.name = "propertyforsale";
    # redis.port = 6379;
    # nginx.clientMaxBodySize = "500M";
    # backup.schedule = "*-*-* 02:00:00";
    # security.enable = true;
  };

  # -- System configuration --------------------------------------------------
  system.stateVersion = "24.05";

  boot.loader.grub.enable = true;
  boot.loader.grub.device = "/dev/sda";

  networking = {
    hostName = "propertyforsale";
    firewall = {
      enable = true;
      allowedTCPPorts = [ 22 80 443 ];
    };
  };

  time.timeZone = "UTC";
  i18n.defaultLocale = "en_US.UTF-8";

  # -- Users ------------------------------------------------------------------
  users.users.deploy = {
    isNormalUser = true;
    extraGroups = [ "wheel" ];
    openssh.authorizedKeys.keys = [
      # Add your SSH public key here
    ];
  };

  security.sudo.wheelNeedsPassword = false;

  services.openssh = {
    enable = true;
    settings = {
      PasswordAuthentication = false;
      PermitRootLogin = "prohibit-password";
    };
  };

  environment.systemPackages = with pkgs; [
    vim
    git
    htop
    curl
    wget
  ];

  system.autoUpgrade = {
    enable = true;
    allowReboot = false;
  };

  nix.gc = {
    automatic = true;
    dates = "weekly";
    options = "--delete-older-than 30d";
  };

  nix.settings.experimental-features = [ "nix-command" "flakes" ];
}
