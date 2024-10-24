## [1.0.0-development.7](https://github.com/WanderDinizVeloso/tickets/compare/1.0.0-development.6...1.0.0-development.7) (2024-10-24)

### Features

* add auth change-password ([84dbdaf](https://github.com/WanderDinizVeloso/tickets/commit/84dbdaf2ca1c81a91bc4e465260d08302e727683))
* add auth config in app module ([af0bd79](https://github.com/WanderDinizVeloso/tickets/commit/af0bd7929b0fbc0d51348e7a8f1ea218e62bb07e))
* add auth config in swagger ([4059182](https://github.com/WanderDinizVeloso/tickets/commit/40591825e30e77a8bdba1277f2462f5d2d693bbd))
* add auth controller ([5036beb](https://github.com/WanderDinizVeloso/tickets/commit/5036bebf1b7763b2f96f129b069084bb393e5332))
* add auth DTOs ([862fd92](https://github.com/WanderDinizVeloso/tickets/commit/862fd92530e42df8dd78c57572103dd7776ff8ee))
* add auth interface ([b229d12](https://github.com/WanderDinizVeloso/tickets/commit/b229d12c278fb02cdee416dbfe1ee0f09b11d5f5))
* add auth module ([38529e7](https://github.com/WanderDinizVeloso/tickets/commit/38529e7fa7a1465a45b2298a0713fdeeaf7b7587))
* add auth schemas ([72ad8cd](https://github.com/WanderDinizVeloso/tickets/commit/72ad8cde845a50ac6490632b05bf236d917660b8))
* add auth service ([de31965](https://github.com/WanderDinizVeloso/tickets/commit/de3196537ae96de0b76b06073f131e6e920131b2))
* add authGuard ([7eb1561](https://github.com/WanderDinizVeloso/tickets/commit/7eb1561263c663f3bd26838c5308ca1a3fcdf7ae))
* add encrypt module ([e9bf481](https://github.com/WanderDinizVeloso/tickets/commit/e9bf481bc5cabc0c15c487da414e24c2c6937bd2))
* add encrypt service ([f82682b](https://github.com/WanderDinizVeloso/tickets/commit/f82682b90bb29c1f0d133a30420c0970fd470217))
* add forgot-password DTO ([444f479](https://github.com/WanderDinizVeloso/tickets/commit/444f479a4ff02e601182865eac73a81e7ddba63f))
* add forgotPassword and storeResetToken services in auth service ([8eb5ec8](https://github.com/WanderDinizVeloso/tickets/commit/8eb5ec83b523aa5dec760c3627a6d3b8ccaa1a2b))
* add IForgotPasswordResponse interface ([244260a](https://github.com/WanderDinizVeloso/tickets/commit/244260ab8bb08c128820ce592da13afd92889bc5))
* add mail constants ([1492649](https://github.com/WanderDinizVeloso/tickets/commit/1492649d4a882e9cd3bee83ea14602fce2d580e4))
* add mail module ([651d7ed](https://github.com/WanderDinizVeloso/tickets/commit/651d7ed265d2a5e1350a89c919d9f816179c111a))
* add mail module in app module ([17fdbfb](https://github.com/WanderDinizVeloso/tickets/commit/17fdbfb1c4fe9d5baf028ed6c0c42fbd3a6c9513))
* add mail service ([3dd9b69](https://github.com/WanderDinizVeloso/tickets/commit/3dd9b69d4b58e2ac99fb097970b8a529633d9657))
* add nodemailer dependencies ([b79057a](https://github.com/WanderDinizVeloso/tickets/commit/b79057a043113a517cb900b267195421542dd38b))
* add POST forgotPassword in auth controller ([d67eeaf](https://github.com/WanderDinizVeloso/tickets/commit/d67eeafc52a32a4f5970b7ac9f2f2481adec04a8))
* add POST resetPassword in auth controller ([aa8bb12](https://github.com/WanderDinizVeloso/tickets/commit/aa8bb12a845e7e737963316589bd99264b50b3d0))
* add public decorator custom ([ea823cf](https://github.com/WanderDinizVeloso/tickets/commit/ea823cfeb454a7c1e124bbaff5b3dc4567b01235))
* add reset password constants ([0430905](https://github.com/WanderDinizVeloso/tickets/commit/0430905749e5745ecfd9a3e743fd437f3ad8dedc))
* add resetPassword DTO ([0527701](https://github.com/WanderDinizVeloso/tickets/commit/0527701f6fcaa504bb72fdd2aaa07a0f7f2db9be))
* add resetPassword service in auth service ([b97571a](https://github.com/WanderDinizVeloso/tickets/commit/b97571a5c6ab3ce307b8c8d27cd923a7e365ca2c))
* add resetToken collection config in auth module ([99e1d2b](https://github.com/WanderDinizVeloso/tickets/commit/99e1d2b2c8c138d144a249445c3d8768a3f4fb07))
* add resetToken schema ([ed3ce31](https://github.com/WanderDinizVeloso/tickets/commit/ed3ce3182685b4fc14a39c8d4534fd58030c451e))
* change the name of the field "token" to "refreshToken" in the refreshtoken collection ([3e5d18d](https://github.com/WanderDinizVeloso/tickets/commit/3e5d18d70c9e4f5639d30cc86bb1b50716396a27))

### Bug Fixes

* sendPasswordResetEmail await remove in transporter.sendMail ([beb68ba](https://github.com/WanderDinizVeloso/tickets/commit/beb68baeeff16a403a8bdc6c7109853e3accf4c8))

## [1.0.0-development.6](https://github.com/WanderDinizVeloso/tickets/compare/1.0.0-development.5...1.0.0-development.6) (2024-09-25)

### Features

* add mongoose connection syncIndexes in products, orders and cards modules ([dc2723a](https://github.com/WanderDinizVeloso/tickets/commit/dc2723ad3e6fa36c1f45268e3e15046f4269d552))
* add tenant DTOs ([ed5b70f](https://github.com/WanderDinizVeloso/tickets/commit/ed5b70f2c02d65ff1c1b5d8a57d0a65516f16735))
* add tenant schema ([20db2e5](https://github.com/WanderDinizVeloso/tickets/commit/20db2e578acfa15c8986108f238e9141a83a66e5))
* add tenants controller ([757116c](https://github.com/WanderDinizVeloso/tickets/commit/757116c355f3b57e92b45171b642067962a22b7a))
* add tenants interface ([d01d061](https://github.com/WanderDinizVeloso/tickets/commit/d01d061861480ff667410a631002cfb45f15ff54))
* add tenants module ([3748335](https://github.com/WanderDinizVeloso/tickets/commit/374833584b9493464f227fd0c4b96ddd4230501f))
* add tenants module in app module ([8b10b31](https://github.com/WanderDinizVeloso/tickets/commit/8b10b31179d25685a0eef5b023fe05716c3aded7))
* add tenants services ([f85d13d](https://github.com/WanderDinizVeloso/tickets/commit/f85d13df450a1fe1a275967191e68b67e32cc72d))
* add tenants utils magic numbers and string liberals ([9c0c9b5](https://github.com/WanderDinizVeloso/tickets/commit/9c0c9b59325dbf8e2ef0be451efe64d91b8bb467))

## [1.0.0-development.5](https://github.com/WanderDinizVeloso/tickets/compare/1.0.0-development.4...1.0.0-development.5) (2024-09-19)

### Features

* add card query DTO ([3b7bce0](https://github.com/WanderDinizVeloso/tickets/commit/3b7bce0de9ccdb0b1d21e65d1d82b7ab572f7551))
* add IcardsTransformExecParam interface in cards interface ([b35aeb0](https://github.com/WanderDinizVeloso/tickets/commit/b35aeb0a2d4a7856029d432592895e0d309b9fdf))
* add IproductsTransformExecParam interface in products interface ([9aea4c8](https://github.com/WanderDinizVeloso/tickets/commit/9aea4c8280f2141c8ebcc681b9decdfa1d475597))
* add order query DTO ([8aece7b](https://github.com/WanderDinizVeloso/tickets/commit/8aece7b4062eba1b968670cea791025e289d6582))
* add orders interface ([456d11e](https://github.com/WanderDinizVeloso/tickets/commit/456d11eb6dcd0c00cf4c84f9427ed1f1ff30d5e7))
* add product query dto ([8208d64](https://github.com/WanderDinizVeloso/tickets/commit/8208d64b3588fd4c45ad1d780d99ca02c06c05d2))
* add queries param in cards controller ([55dfd26](https://github.com/WanderDinizVeloso/tickets/commit/55dfd2634173c263ff0b970893b5f241ddb6107a))
* add queries param in cards service ([59693ef](https://github.com/WanderDinizVeloso/tickets/commit/59693eff38bf149dfcdb7ccb39f16e5c03a0c73f))
* add queries param in orders controller ([ac924ce](https://github.com/WanderDinizVeloso/tickets/commit/ac924ce29bea4749bff1cf4ad6013f4a7a24539f))
* add queries param in orders services ([12ad355](https://github.com/WanderDinizVeloso/tickets/commit/12ad355397920cb2772ba72ee5398dbdbe3cefee))
* add queries param in products controller findAll ([777f4ca](https://github.com/WanderDinizVeloso/tickets/commit/777f4ca43ba00d2d38073c71db83bf033a9f6fb1))
* add queries param in products services ([197eb8a](https://github.com/WanderDinizVeloso/tickets/commit/197eb8a3e27161e58f2999bac17301a9cf1a2cb7))
* add validateRegisteredCards in cards service ([b8f14cc](https://github.com/WanderDinizVeloso/tickets/commit/b8f14cc24fe09b672ec941a3d4ab215bd7c2e34b))
* add validateUniqueProductIds in orders service ([65fbe91](https://github.com/WanderDinizVeloso/tickets/commit/65fbe9154a5f3021afd431cdc5a960dd12b01938))

### Bug Fixes

* productQueryDto id optional fix ([7a79c49](https://github.com/WanderDinizVeloso/tickets/commit/7a79c49602fa99b12a2d9943ea787a06f3fb8d86))
* productQueryDto type attributes fix ([51941b4](https://github.com/WanderDinizVeloso/tickets/commit/51941b42be832215973dce55e577b5d036930108))

## [1.0.0-development.4](https://github.com/WanderDinizVeloso/tickets/compare/1.0.0-development.3...1.0.0-development.4) (2024-09-17)

### Features

* add card schema ([d2eea66](https://github.com/WanderDinizVeloso/tickets/commit/d2eea66d511f9ce59f49abf6abb4e88a401a89d0))
* add cards controller ([ae9e546](https://github.com/WanderDinizVeloso/tickets/commit/ae9e5468ca4e0fafaf94f263407e290ee8fbf13e))
* add cards interface ([fb7debe](https://github.com/WanderDinizVeloso/tickets/commit/fb7debe8e8bb925a70b87a978955aab209e71184))
* add cards module ([0db8fbd](https://github.com/WanderDinizVeloso/tickets/commit/0db8fbdc82ff852b4866783ff229d78f4aa1f70e))
* add cards module in app module ([51f4b6d](https://github.com/WanderDinizVeloso/tickets/commit/51f4b6d0d372018c322f5fa741cfb34a424ee280))
* add cards service ([53288d7](https://github.com/WanderDinizVeloso/tickets/commit/53288d737b646949590ba7496bfc64e8b7834880))
* add create-card dto ([b4c3af6](https://github.com/WanderDinizVeloso/tickets/commit/b4c3af60cf80780e8de96bca919b67e776e8f17e))
* add OrdersService in orders exports ([183502e](https://github.com/WanderDinizVeloso/tickets/commit/183502e24d8ec10b5b62c2210cbe85992e940b77))

### Bug Fixes

* remove productsModule in Orders e2e tests imports ([673a45e](https://github.com/WanderDinizVeloso/tickets/commit/673a45edfd0d70c1ab31f584cc923648c920869c))

## [1.0.0-development.3](https://github.com/WanderDinizVeloso/tickets/compare/1.0.0-development.2...1.0.0-development.3) (2024-09-14)

### Bug Fixes

* findAllBetweenIds return active fix ([8fa98b7](https://github.com/WanderDinizVeloso/tickets/commit/8fa98b71f199344e09569c3147bda0cf339c2876))

## [1.0.0-development.2](https://github.com/WanderDinizVeloso/tickets/compare/1.0.0-development.1...1.0.0-development.2) (2024-09-13)

### Features

* add create order dto ([1f510b9](https://github.com/WanderDinizVeloso/tickets/commit/1f510b9a486ac962d9ec5f6745d01904a1c78f75))
* add decimal128 module ([587d1c7](https://github.com/WanderDinizVeloso/tickets/commit/587d1c7dbf707113a89c146f4b4eab747aa26b74))
* add folder ignore in jest coverage ([55b6928](https://github.com/WanderDinizVeloso/tickets/commit/55b6928df554102a60b7a60ab9305ca2fafc084e))
* add monetary data module ([4dee099](https://github.com/WanderDinizVeloso/tickets/commit/4dee099d4cdf6449340fc80411d79322506b4259))
* add monetary data service ([d7a8f25](https://github.com/WanderDinizVeloso/tickets/commit/d7a8f254a079bcf1cac7f2f8b0193ed05b37fc82))
* add monetary data service in product schema ([140e667](https://github.com/WanderDinizVeloso/tickets/commit/140e667aadae5adcbe7d442ad216ba29fcf947cb))
* add monetary data service in products module ([8b963f6](https://github.com/WanderDinizVeloso/tickets/commit/8b963f676caebc842df29d84581bffb4576168f2))
* add order controller ([11b7411](https://github.com/WanderDinizVeloso/tickets/commit/11b741113db68cc618c5a18c94a812ff2d675460))
* add order interface ([f3b079f](https://github.com/WanderDinizVeloso/tickets/commit/f3b079ffcc8355a887c8e92d0838174d123dd793))
* add order module ([acc8ad5](https://github.com/WanderDinizVeloso/tickets/commit/acc8ad5319a9cff2e1bbee4e829ad6a44bc4bf90))
* add order module and monetary data module in app module ([3c21e1e](https://github.com/WanderDinizVeloso/tickets/commit/3c21e1e7ffe6f9bb901bb458946e7f431bbd39af))
* add order schema ([a4dd861](https://github.com/WanderDinizVeloso/tickets/commit/a4dd861fecd465087030c37a597a5c4887feff02))
* add order service ([6ed4205](https://github.com/WanderDinizVeloso/tickets/commit/6ed42051d39ee2a61f3dd7f9af442d7f389d03ee))
* add spec.ts ignore in jest-coverage-config.json ([757e493](https://github.com/WanderDinizVeloso/tickets/commit/757e4938d5c307d7c5cf45bfd8544b2e3c6234be))

## 1.0.0-development.1 (2024-08-22)

### Features

* add  products schema ([2459ca1](https://github.com/WanderDinizVeloso/tickets/commit/2459ca11843377f6297b73d2457140d925205d9c))
* add error interface ([d2af77e](https://github.com/WanderDinizVeloso/tickets/commit/d2af77e9ff3c6b3215712ce243ce8f6eab7846a7))
* add husky pre-push ([3380ad5](https://github.com/WanderDinizVeloso/tickets/commit/3380ad56b92c0448121a98b1ee482cf1d594f91e))
* add is-positive-decimal validator custom ([1e4fb54](https://github.com/WanderDinizVeloso/tickets/commit/1e4fb5435139300a01de052e5e7b90871f601bb7))
* add products controller ([7ae6465](https://github.com/WanderDinizVeloso/tickets/commit/7ae64656dc0661fe2c290a1f3aaf0605d87c611d))
* add products module ([ac83524](https://github.com/WanderDinizVeloso/tickets/commit/ac83524d630a5b91ff5bb50766df7b3fd4c52def))
* add products module and mongoose module in app module ([5b292ae](https://github.com/WanderDinizVeloso/tickets/commit/5b292ae90958f9477e611ba8662ff4ebd382994a))
* add products service ([50bcf49](https://github.com/WanderDinizVeloso/tickets/commit/50bcf4914ff0512b16763be5e87601406760c9c7))
* add unique-atribute interceptor ([9a6ea33](https://github.com/WanderDinizVeloso/tickets/commit/9a6ea33909412b68c8e5fe6cba1f73c179e9f1b3))
* add uniqueAttributeInterceptor in global interceptors ([02f03ba](https://github.com/WanderDinizVeloso/tickets/commit/02f03bab571986d234e22f7b63b4ae137affea6e))
* create products dtos ([90427ce](https://github.com/WanderDinizVeloso/tickets/commit/90427cea02e6765366351677e8422705e052db3b))
* initial commit ([74d9cf6](https://github.com/WanderDinizVeloso/tickets/commit/74d9cf6d49fef364af49a3860b3712e10949ae74))
* invalid-id interceptor message edit ([d1a2efc](https://github.com/WanderDinizVeloso/tickets/commit/d1a2efcb602816ac5c9735518f8072e3a5dfc313))
* mongo image update ([566a0ea](https://github.com/WanderDinizVeloso/tickets/commit/566a0ea97b3e56fd00db49565e86c16c89a115df))
* test config update ([4a749b2](https://github.com/WanderDinizVeloso/tickets/commit/4a749b2217e935d8cc5391a6656480dd8c791cdf))
