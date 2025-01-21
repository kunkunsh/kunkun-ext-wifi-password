# Wifi Password Share

[JSR Package: `@kunkun/kunkun-ext-wifi-password`](https://jsr.io/@kunkun)

## Platforms

- MacOS
  ```bash
      networksetup -listpreferredwirelessnetworks en0
      security find-generic-password -D "AirPort network password" -a $SSID -w
  ```
- Windows
  ```powershell
  (((netsh wlan show profiles | findstr "Profile") -split ":",2) | findstr /v "Profile").trim(); # find all wifi ssid
  $_, $ssid = ((netsh wlan show interface | findstr "Profile" | findstr /v "mode") -split ":",2).trim(); # find current wifi ssid
  $_, $pass = ((netsh wlan show profile name=$ssid key=clear | findstr Key) -split ":").trim(); # find current wifi password
  ```
- Linux
  ```bash
  ssid=$(nmcli device wifi show-password | grep SSID | cut -d : -f 2 | xargs)
  password=$(nmcli device wifi show-password | grep Password | cut -d : -f 2 | xargs)
  ```

## Features

- Reveal Wifi Password from current machine
- Generate Connection QR Code, mobile devices can scan to connect directly
