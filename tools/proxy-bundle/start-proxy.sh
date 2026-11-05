#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
VERSION="v26.13.0"

have_node() {
	if command -v node >/dev/null 2>&1; then
		local major
		major="$(node -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null || echo 0)"
		[ "${major:-0}" -ge 18 ]
	else
		return 1
	fi
}

install_node() {
	local os arch platform name url expected actual
	os="$(uname -s)"
	arch="$(uname -m)"
	case "$os" in
		Darwin)
			case "$arch" in
				arm64) platform="darwin-arm64" ;;
				x86_64) platform="darwin-x64" ;;
				*) echo "Unsupported macOS architecture: $arch"; return 1 ;;
			esac
			;;
		Linux)
			case "$arch" in
				x86_64) platform="linux-x64" ;;
				aarch64 | arm64) platform="linux-arm64" ;;
				*) echo "Unsupported Linux architecture: $arch"; return 1 ;;
			esac
			;;
		*)
			echo "Unsupported OS: $os"
			return 1
			;;
	esac

	name="node-$VERSION-$platform"
	url="https://nodejs.org/dist/$VERSION/$name.tar.gz"
	echo "Downloading $url"
	curl -fL "$url" -o "$name.tar.gz"
	curl -fL "https://nodejs.org/dist/$VERSION/SHASUMS256.txt" -o SHASUMS256.txt

	expected="$(grep " $name.tar.gz$" SHASUMS256.txt | awk '{print $1}' | head -n1)"
	if command -v sha256sum >/dev/null 2>&1; then
		actual="$(sha256sum "$name.tar.gz" | awk '{print $1}')"
	elif command -v shasum >/dev/null 2>&1; then
		actual="$(shasum -a 256 "$name.tar.gz" | awk '{print $1}')"
	else
		echo "No SHA-256 tool found (sha256sum or shasum)."
		return 1
	fi

	if [ -z "$expected" ] || [ "$expected" != "$actual" ]; then
		echo "Checksum verification failed."
		return 1
	fi

	mkdir -p node
	tar -xzf "$name.tar.gz" -C node
	rm -f "$name.tar.gz" SHASUMS256.txt

	NODE_BIN="$PWD/node/$name/bin/node"
	if [ ! -x "$NODE_BIN" ]; then
		echo "node binary not found after extraction."
		return 1
	fi
}

if have_node; then
	NODE_BIN="$(command -v node)"
else
	echo
	echo "Node.js 18+ was not found."
	printf "Download a portable Node.js into this folder now? [Y/n] "
	read -r answer || answer=""
	case "$answer" in
		[Nn]*)
			echo "Install Node.js 18+ from https://nodejs.org/ and run this script again."
			exit 1
			;;
	esac
	install_node || exit 1
fi

echo
echo "Starting DeepPCB local proxy..."
echo "Keep this window open while using the extension."
echo
"$NODE_BIN" "$PWD/deeppcb-proxy.mjs"
echo
echo "Proxy stopped."

# Keep a macOS double-click Terminal window open.
if [ "${0##*.}" = "command" ] || [ -t 0 ]; then
	printf "Press Enter to close..."
	read -r _ || true
fi
