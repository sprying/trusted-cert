#2021-06-01
1. openssl命令不存在时，使用node-forge生成证书，window电脑可能没安装openssl

#2021-05-31
1. certificateFor api 新增检测openssl是否存在

# 2021-05-30
1. 新增为ip添加证书，默认支持127.0.0.1，另外最多可添加4个ip

# 2021-05-19
1. certificateFor 功能扩展
  - 支持options.silent配置
  - 在Password: 前增加提示文案
2. 解决域名*.fa可以匹配*.fam的问题 

# 2021-05-13
1. 默认支持ip 127.0.0.1 

# 2021-04-19
1. 接入typescript

# 2021-04-15
1. certificateFor api新增返回两个字段

# 2020-07-14
1. 支持window
2. 包名从trusted-cert改成https-cert

# 2020-06-04
1. 代码架构调整，为支持自定义提示、默认域名和为后面支持window做铺垫

# 2020-04-28
1. 解决chrome访问 ERR_SSL_KEY_USAGE_INCOMPATIBLE 问题

# 2020-04-16
1. 包名调整为 trusted-cert

# 2020-04-13
1. 发布第一版
