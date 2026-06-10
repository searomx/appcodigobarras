# MasterWood Barcode Reader

Aplicativo React Native com TypeScript para leitura de codigo de barras Code 128/128A e consulta de produto no endpoint remoto do MasterWood.

## Funcionalidades

- Splash inicial com `logo-pf.png` centralizada.
- Leitura pela camera usando `react-native-vision-camera`.
- Scanner limitado ao formato `code-128`.
- Consulta GET via `fetch` com TanStack Query.
- Estado de fluxo com Zustand.
- Formulario somente leitura com `id`, `reference`, `name`, `especie`, `gradingStandard`, `unitType` e `stock`.
- Botao para fechar os detalhes e voltar ao leitor.

## API

A configuracao fica em `src/config/environment.ts`.

Em desenvolvimento:

- Android emulator usa `http://10.0.2.2:8080/rest.php`.
- iOS simulator e demais plataformas usam `http://localhost/rest.php`.

Para Android em dispositivo fisico, configure o modo em `src/config/environment.ts`:

- `usb-reverse` (padrao): usa `localhost` no Android e exige `adb reverse tcp:8080 tcp:8080`.
- `wifi-device`: usa o IP local do computador (`androidDevWifiHost`).

Em producao, o app usa:

```txt
https://www.mw.sisvennet.com.br/rest.php
```

Os parametros enviados sao:

```txt
class=ProductService
method=getProdutos
codigo=<codigo_lido>
```

Se o backend esperar outro nome de parametro para o codigo, altere `productCodeParam` em `src/config/environment.ts`.

## Documentacao Swagger (OpenAPI)

A especificacao da API consumida pelo app esta em `docs/swagger.yaml`.

Para visualizar:

1. Acesse https://editor.swagger.io
2. Clique em **File > Import File**
3. Selecione `docs/swagger.yaml`

Opcionalmente, rode um Swagger UI local com Docker:

```sh
docker run --rm -p 8081:8080 -e SWAGGER_JSON=/app/swagger.yaml -v "${PWD}/docs:/app" swaggerapi/swagger-ui
```

Depois abra `http://localhost:8081` no navegador.

## Desenvolvimento

Instale dependencias:

```sh
npm install
```

Inicie o Metro:

```sh
npm start
```

Android:

```sh
npm run android:dev
```

O script `android:dev` agora sobe o app em debug usando o Metro padrao do React Native. Use `android:dev:no-packager` apenas se o Metro ja estiver rodando manualmente.

Se aparecer `Unable to load script`, siga esta ordem:

```sh
npm run metro:reset
```

Em outro terminal:

```sh
npm run android:dev
```

Em dispositivo fisico Android, execute antes:

```sh
adb reverse tcp:8081 tcp:8081
```

Se estiver rodando um APK release, gere-o com `npm run build:android:release`, porque a versao release nao usa o Metro em tempo de execucao e precisa do bundle embarcado no build.

Se aparecer erro de certificado ao baixar o Gradle, como `PKIX path building failed`, instale/importe o certificado da sua rede no Java usado pelo Android Studio ou baixe o Gradle por uma rede sem interceptacao SSL. O arquivo solicitado pelo wrapper fica em `android/gradle/wrapper/gradle-wrapper.properties`.

Neste ambiente o wrapper foi apontado para `gradle-9.3.1-bin.zip` local na raiz do projeto, pois o Java nao conseguia validar o certificado de `services.gradle.org`. Se esse ZIP for removido, baixe novamente a distribuicao Gradle 9.3.1 ou retorne `distributionUrl` para HTTPS depois de corrigir o certificado do Java.

iOS, em macOS:

```sh
cd ios
bundle install
bundle exec pod install
cd ..
npm run ios
```

## Producao

Android release:

```sh
npm run build:android:release
```

Esse script faz `clean`, regenera o `prefab` do VisionCamera e so entao roda o `assembleRelease`, evitando a falha intermitente de CMake/Prefab observada neste ambiente Windows.

iOS release, em macOS com Xcode configurado:

```sh
npm run build:ios:release
```

Antes de publicar Android, configure uma keystore propria em `android/app/build.gradle`; o template ainda usa a keystore de debug como padrao inicial.

## Verificacao

```sh
npm run lint
npm exec tsc -- --noEmit
npm test -- --runInBand
npm audit --omit=dev
```
