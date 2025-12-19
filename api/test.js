export default function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 获取请求信息
  const requestInfo = {
    timestamp: new Date().toISOString(),
    timestampReadable: new Date().toLocaleString('zh-CN'),
    method: req.method,
    url: req.url,
    path: req.url.split('?')[0], // 只取路径部分，不包含查询参数
    headers: req.headers,
    query: req.query,
    body: req.body,
    cookies: req.cookies,
    // 获取客户端IP
    ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress,
    // Vercel特定信息
    host: req.headers['host'],
    userAgent: req.headers['user-agent'],
    // 请求来源
    referer: req.headers['referer'] || req.headers['referrer'] || 'direct'
  };
  
  // 设置响应头
  res.setHeader('Content-Type', 'application/json');
  
  // 处理 /test 路径的请求
  if (requestInfo.path === '/test' || requestInfo.path === '/api/test' || requestInfo.path === '/test/') {
    console.log(`[${requestInfo.timestampReadable}] ${req.method} ${req.url} - IP: ${requestInfo.ip}`);
    
    // 处理 GET 请求
    if (req.method === 'GET') {
      // 检查是否有特定的查询参数
      if (req.query.echo) {
        return res.status(200).json({
          success: true,
          message: 'GET 请求成功 - Echo 模式',
          echo: req.query.echo,
          request: {
            timestamp: requestInfo.timestamp,
            method: requestInfo.method,
            query: requestInfo.query,
            ip: requestInfo.ip,
            userAgent: requestInfo.userAgent
          },
          serverInfo: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            nodeVersion: process.version
          }
        });
      }
      
      // 默认 GET 响应
      return res.status(200).json({
        success: true,
        message: '/test 接口 GET 请求成功',
        description: '这是一个测试接口，用于测试 GET 和 POST 请求',
        endpoints: {
          GET: '返回此信息，支持 echo 参数',
          POST: '接收 JSON 或表单数据并返回',
          examples: {
            getEcho: '/test?echo=你好世界',
            postExample: 'POST /test 带有 JSON 体'
          }
        },
        request: requestInfo,
        note: '尝试使用 POST 方法发送数据，或使用 ?echo=你的消息 参数'
      });
    }
    
    // 处理 POST 请求
    if (req.method === 'POST') {
      // 检查请求体类型
      const contentType = req.headers['content-type'] || '';
      let parsedBody = requestInfo.body;
      
      // 尝试解析不同格式的请求体
      if (contentType.includes('application/json') && typeof req.body === 'string') {
        try {
          parsedBody = JSON.parse(req.body);
        } catch (e) {
          console.error('JSON解析错误:', e);
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // 表单数据处理
        parsedBody = { formData: req.body };
      }
      
      // 特殊处理：模拟登录
      if (parsedBody && parsedBody.action === 'login') {
        return res.status(200).json({
          success: true,
          message: '/test 接口 POST 请求 - 登录模拟',
          action: 'login',
          user: parsedBody.username || '未知用户',
          status: 'authenticated',
          token: 'mock-jwt-token-' + Date.now(),
          expires: new Date(Date.now() + 3600000).toISOString(),
          request: {
            timestamp: requestInfo.timestamp,
            method: requestInfo.method,
            body: parsedBody,
            contentType: contentType,
            ip: requestInfo.ip
          }
        });
      }
      
      // 特殊处理：模拟数据提交
      if (parsedBody && parsedBody.action === 'submit') {
        return res.status(201).json({
          success: true,
          message: '/test 接口 POST 请求 - 数据提交成功',
          action: 'submit',
          submittedData: parsedBody.data || parsedBody,
          recordId: 'record_' + Math.random().toString(36).substr(2, 9),
          createdAt: requestInfo.timestamp,
          request: {
            timestamp: requestInfo.timestamp,
            method: requestInfo.method,
            body: parsedBody,
            ip: requestInfo.ip
          }
        });
      }
      
      // 默认 POST 响应
      return res.status(200).json({
        success: true,
        message: '/test 接口 POST 请求成功',
        receivedData: parsedBody,
        contentType: contentType,
        dataSize: req.headers['content-length'] || '未知',
        request: {
          timestamp: requestInfo.timestamp,
          method: requestInfo.method,
          body: parsedBody,
          headers: {
            'content-type': contentType,
            'user-agent': requestInfo.userAgent
          },
          ip: requestInfo.ip
        },
        note: '数据已成功接收和处理',
        nextSteps: [
          '使用 action: "login" 模拟登录',
          '使用 action: "submit" 模拟数据提交',
          '或发送任意 JSON 数据测试'
        ]
      });
    }
    
    // /test 路径的其他请求方法
    return res.status(405).json({
      success: false,
      message: `请求方法 ${req.method} 不被 /test 接口支持`,
      allowedMethods: ['GET', 'POST'],
      request: requestInfo
    });
  }
  
  // 处理根路径 / 的请求
  if (requestInfo.path === '/' || requestInfo.path === '') {
    return res.status(200).json({
      success: true,
      message: 'API 根路径',
      description: '这是一个在 Vercel 上运行的测试 API',
      availableEndpoints: {
        '/': '此信息页面',
        '/test': {
          GET: '测试 GET 请求',
          POST: '测试 POST 请求',
          description: '支持多种测试场景'
        },
        '/api/test': '原始测试接口（返回完整请求信息）',
        usage: {
          testGet: 'curl https://your-domain.vercel.app/test',
          testGetWithParams: 'curl https://your-domain.vercel.app/test?echo=hello',
          testPost: 'curl -X POST https://your-domain.vercel.app/test -H "Content-Type: application/json" -d \'{"key":"value"}\''
        }
      },
      serverInfo: {
        timestamp: requestInfo.timestamp,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        environment: process.env.NODE_ENV || 'development'
      },
      request: requestInfo
    });
  }
  
  // 原始 /api/test 接口逻辑（保持原样）
  // 根据不同请求方法返回不同格式
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'GET请求成功',
      request: requestInfo,
      note: '尝试使用POST/PUT/DELETE方法发送数据，或访问 /test 接口'
    });
  }
  
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    return res.status(200).json({
      message: `${req.method}请求成功`,
      request: requestInfo,
      receivedData: requestInfo.body,
      note: '数据已成功接收，或访问 /test 接口进行更多测试'
    });
  }
  
  if (req.method === 'DELETE') {
    return res.status(200).json({
      message: 'DELETE请求成功',
      request: requestInfo,
      note: '删除操作已记录'
    });
  }
  
  // 其他方法
  res.status(200).json({
    message: `请求方法 ${req.method} 已处理`,
    request: requestInfo
  });
}
