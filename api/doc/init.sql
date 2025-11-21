-- 用户 密码 14159
INSERT INTO `users` (`create_time`, `update_time`, `email`, `is_active`, `last_login_time`, `password`, `real_name`, `role`, `username`) VALUES ('2025-11-17 13:30:13.938430', '2025-11-17 13:30:13.938430', '550019013@qq.com', b'1', NULL, '$2a$10$rta3sjpv15.5HT3BQ9tp9eoi4.r/e9tj7/vkCYwwQfonYYziU8GoK', '谭宁', 'ADMIN', 'admin');


-- 块类型
INSERT INTO `block_types` ( `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES ( '2025-11-18 13:06:14.150584', '2025-11-18 13:06:14.150584', 'server', '服务器', 0);
INSERT INTO `block_types` ( `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES ( '2025-11-18 13:06:35.097076', '2025-11-18 13:06:35.097076', 'maven', 'maven', 1);
INSERT INTO `block_types` ( `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES ( '2025-11-18 13:06:42.879913', '2025-11-18 13:06:42.879913', 'node', 'node', 0);
INSERT INTO `block_types` ( `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES ( '2025-11-18 13:07:18.431345', '2025-11-18 13:07:18.431345', 'tool', '工具', 0);
INSERT INTO `block_types` ( `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES ( '2025-11-18 13:07:27.550446', '2025-11-18 13:07:27.550446', 'notify', '通知', 0);


-- 流程分类
INSERT INTO `workflow_categories` ( `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES ('2025-11-19 22:24:57.052087', '2025-11-19 22:24:57.052087', 'build', '构建', 1);
INSERT INTO `workflow_categories` ( `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES ('2025-11-19 22:25:14.961615', '2025-11-19 22:25:14.961615', 'deploy', '部署', 2);
INSERT INTO `workflow_categories` ( `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES ('2025-11-19 22:25:34.183025', '2025-11-19 22:25:34.183025', 'test', '测试', 3);
INSERT INTO `workflow_categories` ( `create_time`, `update_time`, `code`, `name`, `sort_order`) VALUES ('2025-11-19 22:27:07.523543', '2025-11-19 22:27:07.523543', 'other', '其他', 4);
