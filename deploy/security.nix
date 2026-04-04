# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
#
# Security hardening configuration

{ config, pkgs, lib, ... }:

{
  # Kernel hardening
  boot.kernel.sysctl = {
    # Prevent SYN flood attacks
    "net.ipv4.tcp_syncookies" = 1;

    # Ignore ICMP redirects
    "net.ipv4.conf.all.accept_redirects" = 0;
    "net.ipv4.conf.default.accept_redirects" = 0;
    "net.ipv6.conf.all.accept_redirects" = 0;
    "net.ipv6.conf.default.accept_redirects" = 0;

    # Don't send ICMP redirects
    "net.ipv4.conf.all.send_redirects" = 0;
    "net.ipv4.conf.default.send_redirects" = 0;

    # Refuse source routed packets
    "net.ipv4.conf.all.accept_source_route" = 0;
    "net.ipv4.conf.default.accept_source_route" = 0;
    "net.ipv6.conf.all.accept_source_route" = 0;
    "net.ipv6.conf.default.accept_source_route" = 0;

    # Protect against SYN flood
    "net.ipv4.tcp_max_syn_backlog" = 4096;

    # Ignore ICMP broadcast requests
    "net.ipv4.icmp_echo_ignore_broadcasts" = 1;

    # Enable IP spoofing protection
    "net.ipv4.conf.all.rp_filter" = 1;
    "net.ipv4.conf.default.rp_filter" = 1;

    # Ignore bogus error responses
    "net.ipv4.icmp_ignore_bogus_error_responses" = 1;

    # TCP timestamps protection
    "net.ipv4.tcp_timestamps" = 0;
  };

  # Fail2ban for brute force protection
  services.fail2ban = {
    enable = true;
    maxretry = 5;
    bantime = "1h";
    bantime-increment = {
      enable = true;
      maxtime = "168h"; # 1 week
      factor = "4";
    };

    jails = {
      sshd = {
        settings = {
          filter = "sshd";
          action = "iptables[name=SSH, port=ssh, protocol=tcp]";
          maxRetry = 3;
          banTime = "1h";
        };
      };

      nginx-http-auth = {
        settings = {
          filter = "nginx-http-auth";
          action = "iptables-multiport[name=nginx-http-auth, port=\"http,https\"]";
          maxRetry = 5;
          banTime = "1h";
        };
      };

      nginx-botsearch = {
        settings = {
          filter = "nginx-botsearch";
          action = "iptables-multiport[name=nginx-botsearch, port=\"http,https\"]";
          maxRetry = 2;
          banTime = "1d";
        };
      };
    };
  };

  # Automatic security updates
  system.autoUpgrade = {
    enable = true;
    allowReboot = false;
    dates = "04:00";
    randomizedDelaySec = "45min";
  };

  # Enable audit logging
  security.auditd.enable = true;
  security.audit = {
    enable = true;
    rules = [
      "-w /etc/passwd -p wa -k passwd_changes"
      "-w /etc/group -p wa -k group_changes"
      "-w /etc/shadow -p wa -k shadow_changes"
      "-w /var/lib/propertyforsale -p wa -k propertyforsale_changes"
    ];
  };

  # Limit login attempts
  security.pam.loginLimits = [
    {
      domain = "*";
      item = "maxlogins";
      type = "hard";
      value = "10";
    }
  ];

  # Disable core dumps
  security.pam.loginLimits = [
    {
      domain = "*";
      item = "core";
      type = "hard";
      value = "0";
    }
  ];

  # Restrict dmesg access
  boot.kernel.sysctl."kernel.dmesg_restrict" = 1;

  # Enable AppArmor
  security.apparmor.enable = true;
}
