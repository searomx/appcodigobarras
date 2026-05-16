import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function addLineAfter(filePath, anchor, line) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(line.trim())) {
    return;
  }

  if (!content.includes(anchor)) {
    return;
  }

  content = content.replace(anchor, `${anchor}\n${line}`);
  fs.writeFileSync(filePath, content, 'utf8');
}

const visionCameraCmake = path.join(
  root,
  'node_modules/react-native-vision-camera/android/CMakeLists.txt',
);
addLineAfter(
  visionCameraCmake,
  '        ${LOG_LIB}                          # <-- Logcat logger',
  '        c++_shared                          # <-- Android C++ runtime',
);

const rnApplicationCmake = path.join(
  root,
  'node_modules/react-native/ReactAndroid/cmake-utils/ReactNative-application.cmake',
);
addLineAfter(
  rnApplicationCmake,
  'target_link_libraries(${CMAKE_PROJECT_NAME}',
  '        c++_shared',
);
addLineAfter(
  rnApplicationCmake,
  '            target_link_libraries(${autolinked_library} common_flags)',
  '            target_link_libraries(${autolinked_library} c++_shared)',
);
