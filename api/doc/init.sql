-- 用户
INSERT INTO `db_block_flow`.`users` (`id`, `create_time`, `update_time`, `email`, `is_active`, `last_login_time`, `password`, `real_name`, `role`, `username`) VALUES (1, '2025-11-17 13:30:13.938430', '2025-11-17 13:30:13.938430', '550019013@qq.com', b'1', NULL, '$2a$10$rta3sjpv15.5HT3BQ9tp9eoi4.r/e9tj7/vkCYwwQfonYYziU8GoK', '谭宁', 'ADMIN', 'admin');


-- 块类型
INSERT INTO `db_block_flow`.`block_types` (`id`, `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES (1, '2025-11-18 13:06:14.150584', '2025-11-18 13:06:14.150584', 'server', '服务器', 0);
INSERT INTO `db_block_flow`.`block_types` (`id`, `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES (2, '2025-11-18 13:06:35.097076', '2025-11-18 13:06:35.097076', 'maven', 'maven', 1);
INSERT INTO `db_block_flow`.`block_types` (`id`, `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES (3, '2025-11-18 13:06:42.879913', '2025-11-18 13:06:42.879913', 'node', 'node', 0);
INSERT INTO `db_block_flow`.`block_types` (`id`, `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES (4, '2025-11-18 13:07:18.431345', '2025-11-18 13:07:18.431345', 'tool', '工具', 0);
INSERT INTO `db_block_flow`.`block_types` (`id`, `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES (5, '2025-11-18 13:07:27.550446', '2025-11-18 13:07:27.550446', 'notify', '通知', 0);
