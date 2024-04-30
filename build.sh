#!/bin/bash

echo "(function () {" >> output.js

# Copy in the dependencies
cat deps/moment.js >> output.js
cat deps/Chart.js >> output.js
cat deps/timeline.js >> output.js
cat deps/md5.js >> output.js
cat deps/FileSaver.js >> output.js

# Copy in the actual sources
cat src/languages.js >> output.js
grep -v "^import " src/history-explorer-card.js >> output.js  # Copy without the import lines
cat src/history-chart-vline.js >> output.js
cat src/history-default-colors.js >> output.js
cat src/history-csv-exporter.js >> output.js
cat src/history-info-panel.js >> output.js

echo "})();" >> output.js