FROM docker.io/i386/alpine:3.20

RUN printf '%s\n' \
    'https://dl-cdn.alpinelinux.org/alpine/v3.20/main' \
    'https://dl-cdn.alpinelinux.org/alpine/v3.20/community' \
    > /etc/apk/repositories

RUN echo 'nameserver 8.8.8.8' > /etc/resolv.conf

RUN apk update && apk add --no-cache \
    alpine-base \
    openrc \
    eudev \
    udev-init-scripts \
    dbus \
    xorg-server \
    xf86-input-libinput \
    xrandr \
    lightdm \
    lightdm-gtk-greeter \
    xfce4 \
    xfce4-terminal \
    thunar \
    mousepad \
    xterm \
    adwaita-icon-theme \
    font-dejavu \
    font-noto \
    bash \
    curl \
    wget \
    ca-certificates \
    openssh-client \
    nano \
    vim \
    git \
    procps \
    util-linux \
    coreutils

RUN rc-update add bootmisc boot && \
    rc-update add udev sysinit && \
    rc-update add udev-trigger sysinit && \
    rc-update add udev-settle sysinit && \
    rc-update add udev-postmount default && \
    rc-update add dbus default && \
    rc-update add lightdm default

RUN adduser -D -s /bin/bash user && \
    echo 'user:webvm' | chpasswd && \
    echo 'root:root' | chpasswd

RUN mkdir -p \
    /etc/lightdm/lightdm.conf.d \
    /home/user/Desktop \
    /home/user/.config/xfce4/xfconf/xfce-perchannel-xml \
    /etc/xdg/autostart

COPY scripts/99-webvm-screen-resize.sh /usr/local/bin/99-webvm-screen-resize.sh
RUN chmod 755 /usr/local/bin/99-webvm-screen-resize.sh

RUN cat > /etc/lightdm/lightdm.conf.d/50-webvm-autologin.conf <<'EOF'
[Seat:*]
autologin-user=user
autologin-user-timeout=0
autologin-session=xfce
user-session=xfce
greeter-session=lightdm-gtk-greeter
EOF

RUN cat > /etc/xdg/autostart/webvm-screen-resize.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=WebVM Screen Resize
Exec=/usr/local/bin/99-webvm-screen-resize.sh
OnlyShowIn=XFCE;
NoDisplay=true
X-GNOME-Autostart-enabled=true
EOF

RUN cat > /home/user/.config/xfce4/xfconf/xfce-perchannel-xml/xfwm4.xml <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfwm4" version="1.0">
  <property name="general" type="empty">
    <property name="use_compositing" type="bool" value="false"/>
    <property name="sync_to_vblank" type="bool" value="false"/>
  </property>
</channel>
EOF

RUN cat > /home/user/Desktop/README.txt <<'EOF'
Welcome to the XFCE WebVM.

User password: webvm
Root password: root

For network access:
1. Open the WebVM sidebar.
2. Open Networking.
3. Connect to Tailscale.
4. Use curl or wget to test the connection.

Each website visitor gets an independent VM.
EOF

RUN cat > /usr/local/bin/network-test <<'EOF'
#!/bin/sh
echo "Testing HTTPS through WebVM networking..."
curl -I --max-time 15 https://example.com
EOF

RUN chmod 755 /usr/local/bin/network-test && \
    chown -R user:user /home/user

ENV HOME=/root
ENV USER=root
ENV SHELL=/bin/sh
ENV DISPLAY=:0

CMD ["/sbin/init"]
