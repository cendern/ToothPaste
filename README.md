> If only i could copy this really long password to this really shady computer, we could achieve world peace. Alas! I'm going to type it manually......
>
>\- Someone defintely 

<h1 style="text-align: center; margin: 10;">
  <span style="display: inline-flex; align-items: center; gap: 10px;">
    <img src="https://www.toothpasteapp.com/static/media/ToothPaste.b25d935e801d165e44df.png" alt="drawing" width="70"/>
    <span style="display: flex; flex-direction: column; align-items: center; line-height: 1;">
      <span style="font-weight: bold; font-size: 1.5em; margin: 1 0 5 0; padding: 0; line-height: 1;">ToothPaste: </span>
      <span style="font-style: italic; font-size: 0.6em; margin: 1 0 0 0; padding: 0; line-height: 1;">The Copy-Paste We Were Promised</span>
    </span>
  </span>
</h1>

<div style="text-align: center; margin: 20px">
  <img src="https://img.shields.io/badge/-Arduino-00979D?style=for-the-badge&logo=Arduino&logoColor=white&logoSize=auto" alt="Arduino"/>
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB&logoSize=auto" alt="React"/>
  <img src="https://img.shields.io/badge/c++-%2300599C.svg?style=for-the-badge&logo=c%2B%2B&logoColor=white&logoSize=auto" alt="C++"/>
  <img src="https://img.shields.io/badge/espressif-E7352C.svg?style=for-the-badge&logo=espressif&logoColor=white&logoSize=auto" alt="Espressif"/>
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white&logoSize=auto" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E&logoSize=auto" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/BLE-blue?style=for-the-badge&logo=bluetooth&logoColor=white&logoSize=auto" alt="BLE"/>
</div>



<p style="text-align: center; font-size: 1.2em;">
  <strong>ToothPaste</strong> allows a user to transmit keystrokes to any USB-compatible device over an encrypted channel without the need for specialized drivers or extensive set-up using Bluetooth LE and an ESP-32 based receiver.
</p>

<br/>






## The Problem ❓
The core idea was to eliminate the need for complicated and lengthy login flows for one-off cases where a keyboard would normally be required or is the **only device that is supported** (BIOS, air-gapped systems, shady back-alley computers where you don't want to install your password manager etc.). 

This means existing solutions like [KDE Connect](https://github.com/KDE/kdeconnect-kde) are non-starters since, at the very least, they require both devices to run a compatible operating system and allow installing third-party software.

The obvious answer then, is to use an interface system that is universally supported - USB. Specifically the USB **Human Interface Device (HID)** standard. Almost every USB-host compatible device supports using a keyboard as means of controlling it and because this is presumed to be a direct extension of a user it is implicitly trusted (*keyboards don't have passwords because how would you enter the password* 😐). The [USB Rubber Ducky by Hak5](https://hak5.org/products/usb-rubber-ducky?variant=39874478932081) used this exact idea to spark a security arms-race to exploit devices, but that doesn't have to be the only reason to use it (but you absolutely still can \**wink*\*).

## The Solution Pt. 1 ⭐
Sounds simple enough - all we need is a device that has some kind of wireless capability and the ability to show up as a USB device like the Rubber Ducky. A few options come to mind - 

- Arduino Pro Micro + Bluetooth Module 🔴 (clunky but proven)
- Nordic nrf52840 🟡 (really good but needs a lot of setup and lacks library support for advanced features)
- Espressif ESP32-S3 🟢 (the winner for multiple reasons)
