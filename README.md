# BOTC Friends

A custom browser extension for the Blood on the Clocktower app that allows highlighting of lobbies containing friends and blocked users.

## Build
### Dev Container
This repo comes with a .devcontainer.json configuration for use in VS Code.

1. Launch VS Code using the .devcontainer config.
1. Install the Node packages:
   ```
   npm install
   ```
1. Run the build script:
   ```
   npm run build
   ```
   The build artifacts will be output in `build/`.

### Docker
If you don't have VS Code, you can also build the code in a Docker container:
1. Launch a docker container, mounting the local directory as a volume:
   ```
   docker run -it --rm -v.:/home/node node:22 /bin/bash
   ```
1. Navigate to the home directory where the code is mounted:
   ```
   cd /home/node
   ```
1. Install the Node packages:
   ```
   npm install
   ```
1. Run the build script:
   ```
   npm run build
   ```
   The build artifacts will be output in `build/`.


## Contributors

<!-- readme: contributors -start -->
<table>
	<tbody>
		<tr>
            <td align="center">
                <a href="https://github.com/calebmckay">
                    <img src="https://avatars.githubusercontent.com/u/11079725?v=4" width="100;" alt="calebmckay"/>
                    <br />
                    <sub><b>Caleb McKay</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/rumanstheddy">
                    <img src="https://avatars.githubusercontent.com/u/43084717?v=4" width="100;" alt="rumanstheddy"/>
                    <br />
                    <sub><b>Sumanth Reddy</b></sub>
                </a>
            </td>
		</tr>
	<tbody>
</table>
<!-- readme: contributors -end -->

*This extension is not affiliated with Blood on the Clocktower or The Pandemonium Institute. Blood on the Clocktower is a trademark of Steven Medway and The Pandemonium Institute.*
