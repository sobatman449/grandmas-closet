# Windows Installer Instructions

## How to Build the Windows Installer

1. **Download and Install NSIS**  
   Visit the [NSIS website](https://nsis.sourceforge.io/Download) to download the installer. Follow the installation instructions provided on the site.

2. **Place the `icon.ico` File in the Assets Folder**  
   Ensure that you have the `icon.ico` file ready. Move it to the `assets` folder of your project to ensure it is used in the installer.

3. **Compile the Installer**  
   Locate the `installer.nsis` file in your project directory. Right-click on this file and select `Compile` (or `Compile with NSIS`) to create the installer executable.

4. **Distributing the Installer**  
   Once the compilation is successful, a `.exe` file will be generated. This file is the installer that you can distribute to users.

## Troubleshooting Tips
- If NSIS fails to compile, check the output log for any errors. Common issues may include missing files or incorrect paths in the `installer.nsis` script.
- Ensure that the `icon.ico` file is in the correct `assets` folder before compiling.
- If the installer does not run as expected, verify that all necessary files and dependencies are included in the installer script.

## What the Installer Does for End Users
The installer will guide users through the installation process of Grandmas Closet. It sets up the application, creates necessary shortcuts, and ensures that all components are perfectly configured for a seamless user experience.
