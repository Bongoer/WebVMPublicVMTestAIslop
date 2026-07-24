FROM docker.io/i386/alpine:3.17

RUN printf '%s\n' \
    'https://dl-cdn.alpinelinux.org/alpine/v3.17/main' \
    'https://dl-cdn.alpinelinux.org/alpine/v3.17/community' \
    > /etc/apk/repositories

RUN apk update && apk add --no-cache \
    alpine-base \
    eudev \
    xorg-server \
    xf86-input-libinput \
    xinit \
    xrandr \
    mesa-gl \
    mesa-dri-gallium \
    dbus \
    dbus-x11 \
    su-exec \
    xfce4 \
    xfce4-terminal \
    thunar \
    mousepad \
    xterm \
    font-dejavu \
    adwaita-icon-theme \
    bash \
    curl \
    wget \
    ca-certificates \
    openssh-client \
    nano \
    procps \
    util-linux \
    coreutils


RUN test -f /usr/lib/dri/swrast_dri.so && \
    mkdir -p /usr/lib/xorg/modules/dri && \
    for f in /usr/lib/dri/*_dri.so; do \
      ln -sf "$f" "/usr/lib/xorg/modules/dri/$(basename "$f")"; \
    done && \
    ln -sf \
      /usr/lib/dri/swrast_dri.so \
      "/usr/lib/xorg/modules/dri/CheerpX KMS_dri.so"

RUN adduser -D -s /bin/bash user && \
    echo 'user:webvm' | chpasswd && \
    echo 'root:root' | chpasswd && \
    addgroup user video && \
    addgroup user input && \
    addgroup user audio

COPY rootfs/ /

RUN chmod 755 \
      /usr/local/bin/webvm-xfce-start \
      /usr/local/bin/webvm-xfce-client && \
    if [ -f /usr/local/bin/webvm-resize ]; then \
      chmod 755 /usr/local/bin/webvm-resize; \
    fi && \
    chown -R user:user /home/user

ENV HOME=/root
ENV USER=root
ENV SHELL=/bin/sh
ENV PATH=/sbin:/bin:/usr/sbin:/usr/bin

CMD ["/bin/sh"]
