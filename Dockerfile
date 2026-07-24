FROM docker.io/i386/alpine:3.17

RUN printf '%s\n' \
    'https://dl-cdn.alpinelinux.org/alpine/v3.17/main' \
    'https://dl-cdn.alpinelinux.org/alpine/v3.17/community' \
    > /etc/apk/repositories

RUN apk update && apk add --no-cache \
    alpine-base \
    eudev \
    udev-init-scripts \
    udev-init-scripts-openrc \
    dbus \
    dbus-x11 \
    xorg-server \
    xf86-input-libinput \
    lightdm \
    lightdm-gtk-greeter \
    xfce4 \
    xfce4-terminal \
    thunar \
    mousepad \
    xterm \
    font-dejavu \
    adwaita-icon-theme \
    xrandr \
    bash \
    curl \
    wget \
    ca-certificates \
    openssh-client \
    nano \
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
    echo 'root:root' | chpasswd && \
    addgroup user video && \
    addgroup user input && \
    addgroup user audio

COPY rootfs/ /

RUN chmod 755 /usr/local/bin/webvm-resize && \
    chown -R user:user /home/user

ENV HOME=/root
ENV USER=root
ENV SHELL=/bin/sh
ENV PATH=/sbin:/bin:/usr/sbin:/usr/bin

CMD ["/sbin/init"]
