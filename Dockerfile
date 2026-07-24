FROM docker.io/i386/alpine:3.17 AS xfwm_builder

RUN printf '%s\n' \
    'https://dl-cdn.alpinelinux.org/alpine/v3.17/main' \
    'https://dl-cdn.alpinelinux.org/alpine/v3.17/community' \
    > /etc/apk/repositories

RUN apk update && apk add --no-cache \
    build-base \
    wget \
    bzip2 \
    pkgconf \
    intltool \
    gettext \
    gettext-dev \
    libxfce4ui-dev \
    libwnck3-dev \
    startup-notification-dev \
    libepoxy-dev \
    libdrm-dev \
    libx11-dev \
    libxcomposite-dev \
    libxdamage-dev \
    libxext-dev \
    libxfixes-dev \
    libxi-dev \
    libxinerama-dev \
    libxpresent-dev \
    libxrandr-dev \
    libxrender-dev \
    libxres-dev

WORKDIR /tmp

RUN wget -q \
      https://archive.xfce.org/src/xfce/xfwm4/4.18/xfwm4-4.18.0.tar.bz2 && \
    tar -xjf xfwm4-4.18.0.tar.bz2 && \
    cd xfwm4-4.18.0 && \
    ./configure \
      --prefix=/usr \
      --sysconfdir=/etc \
      --libexecdir=/usr/lib/xfce4 \
      --disable-compositor && \
    make -j2 && \
    make DESTDIR=/out install

FROM docker.io/i386/alpine:3.17

RUN printf '%s\n' \
    'https://dl-cdn.alpinelinux.org/alpine/v3.17/main' \
    'https://dl-cdn.alpinelinux.org/alpine/v3.17/community' \
    > /etc/apk/repositories

RUN apk update && apk add --no-cache \
    alpine-base \
    xorg-server \
    xf86-input-libinput \
    xinit \
    xrandr \
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

RUN adduser -D -s /bin/bash user && \
    echo 'user:webvm' | chpasswd && \
    echo 'root:root' | chpasswd && \
    addgroup user video && \
    addgroup user input && \
    addgroup user audio

COPY --from=xfwm_builder /out/usr/ /usr/
COPY rootfs/ /

RUN chmod 755 /usr/local/bin/webvm-xfce-start && \
    if [ -f /usr/local/bin/webvm-resize ]; then \
      chmod 755 /usr/local/bin/webvm-resize; \
    fi && \
    chown -R user:user /home/user

ENV HOME=/root
ENV USER=root
ENV SHELL=/bin/sh
ENV PATH=/sbin:/bin:/usr/sbin:/usr/bin

CMD ["/bin/sh"]
