# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
#
# NixOS configuration for PropertyForSale production server
# Deploy with: nix run .#deploy -- <server-ip>

{ config, pkgs, lib, ... }:

{
  imports = [
    ./hardware-configuration.nix
    ./nginx.nix
    ./services.nix
    ./security.nix
  ];

  # System configuration
  system.stateVersion = "24.05";

  # Boot configuration
  boot.loader.grub.enable = true;
  boot.loader.grub.device = "/dev/sda";

  # Networking
  networking = {
    hostName = "propertyforsale";
    firewall = {
      enable = true;
      allowedTCPPorts = [ 22 80 443 ];
    };
  };

  # Time zone
  time.timeZone = "UTC";

  # Locale
  i18n.defaultLocale = "en_US.UTF-8";

  # Users
  users.users = {
    propertyforsale = {
      isSystemUser = true;
      group = "propertyforsale";
      home = "/var/lib/propertyforsale";
      createHome = true;
    };

    deploy = {
      isNormalUser = true;
      extraGroups = [ "wheel" ];
      openssh.authorizedKeys.keys = [
        # Add your SSH public key here
      ];
    };
  };

  users.groups.propertyforsale = { };

  # Security - sudo without password for deploy user
  security.sudo.wheelNeedsPassword = false;

  # SSH
  services.openssh = {
    enable = true;
    settings = {
      PasswordAuthentication = false;
      PermitRootLogin = "prohibit-password";
    };
  };

  # Essential packages
  environment.systemPackages = with pkgs; [
    vim
    git
    htop
    curl
    wget
  ];

  # Enable automatic updates
  system.autoUpgrade = {
    enable = true;
    allowReboot = false;
  };

  # Garbage collection
  nix.gc = {
    automatic = true;
    dates = "weekly";
    options = "--delete-older-than 30d";
  };

  # Enable flakes
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
}
