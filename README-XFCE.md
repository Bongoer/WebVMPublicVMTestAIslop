# XFCE WebVM on GitHub Pages

This overlay changes the public WebVM project into a browser-hosted Alpine Linux
XFCE machine.

## Visitor model

Every visitor gets an independent VM running locally inside that visitor's
browser. The original disk image is shared as read-only website data, while
runtime changes stay with the visitor.

A single shared desktop isn't possible using only GitHub Pages because Pages
doesn't run a persistent server.

## Included

- Alpine Linux i386 image
- Xorg
- XFCE desktop
- Thunar
- Mousepad
- XFCE Terminal
- xterm
- curl and wget
- OpenSSH client
- GitHub Actions image builder
- GitHub Pages deployment
- GitHub Codespaces configuration

## Credentials

| Account | Username | Password |
|---|---|---|
| Desktop user | `user` | `webvm` |
| Administrator | `root` | `root` |

Change the passwords in `dockerfiles/xfce/Dockerfile` before deploying a
sensitive custom image.

## Deployment

Enable GitHub Pages with GitHub Actions as the source, then run the
`Build and deploy XFCE WebVM` workflow.

The workflow builds the Linux filesystem, converts it to WebVM's split ext2
format, builds the WebVM frontend, makes the graphical Alpine route the site
homepage, and deploys everything to Pages.
