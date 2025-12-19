export default function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    // 打印OPTIONS请求日志
    console.log(`${getClientIP(req)} - ${req.url} - OPTIONS - 预检请求`);
    return res.status(200).end();
  }
  
  // 获取客户端IP
  const clientIP = getClientIP(req);
  
  // 获取接口路径（去除查询参数）
  const path = req.url.split('?')[0];
  
  // 打印详细的Vercel日志 - 分段打印，确保完整显示
  printVerboseLogs(clientIP, path, req.method, req);
  
  // 获取请求信息
  const requestInfo = {
    timestamp: new Date().toISOString(),
    timestampReadable: new Date().toLocaleString('zh-CN'),
    method: req.method,
    url: req.url,
    path: path,
    headers: req.headers,
    query: req.query,
    body: req.body,
    cookies: req.cookies,
    // 获取客户端IP
    ip: clientIP,
    // Vercel特定信息
    host: req.headers['host'],
    userAgent: req.headers['user-agent'],
    // 请求来源
    referer: req.headers['referer'] || req.headers['referrer'] || 'direct'
  };
  
  // 设置响应头
  res.setHeader('Content-Type', 'application/json');
  
  // 处理 /test 路径的请求
  if (path === '/test' || path === '/api/test' || path === '/test/') {
    // 额外的/test端点日志标记
    console.log(`[TEST接口] 请求开始: ${clientIP} - ${path} - ${req.method}`);
    
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
  if (path === '/' || path === '') {
    // 打印根路径请求日志
    console.log(`[首页] ${clientIP} - 根路径 - ${req.method}`);
    
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

/**
 * 获取客户端IP地址
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         'unknown-ip';
}

/**
 * 打印详细的Vercel日志 - 分段打印，确保完整显示
 */
function printVerboseLogs(ip, path, method, req) {
  const timestamp = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
  
  const shortPath = path === '/' ? '根路径' : path;
  
  // 打印基础信息
  console.log(`[${timestamp}] ${ip} - ${shortPath} - ${method}`);
  
  // 打印查询参数（如果有）
  if (req.query && Object.keys(req.query).length > 0) {
    // 将查询参数分多行打印，确保Vercel能完整显示
    console.log('📋 查询参数:');
    Object.keys(req.query).forEach(key => {
      console.log(`  ${key}: ${JSON.stringify(req.query[key])}`);
    });
  } else {
    console.log('📋 查询参数: 无');
  }
  
  // 打印请求体（如果有）
  if (req.body) {
    console.log('📦 请求体:');
    
    try {
      // 尝试解析JSON
      let parsedBody = req.body;
      const contentType = req.headers['content-type'] || '';
      
      if (contentType.includes('application/json') && typeof req.body === 'string') {
        parsedBody = JSON.parse(req.body);
      }
      
      // 打印请求体类型
      console.log(`  类型: ${contentType || 'unknown'}`);
      
      // 根据类型打印内容
      if (typeof parsedBody === 'object' && parsedBody !== null) {
        // 打印对象键值对
        Object.keys(parsedBody).forEach(key => {
          const value = parsedBody[key];
          let valueStr;
          
          if (typeof value === 'object' && value !== null) {
            valueStr = JSON.stringify(value);
            // 如果太长，截断
            if (valueStr.length > 200) {
              valueStr = valueStr.substring(0, 200) + '... [截断]';
            }
          } else {
            valueStr = String(value);
          }
          
          console.log(`  ${key}: ${valueStr}`);
        });
      } else {
        // 打印非对象内容
        let bodyStr = String(parsedBody);
        if (bodyStr.length > 200) {
          bodyStr = bodyStr.substring(0, 200) + '... [截断]';
        }
        console.log(`  内容: ${bodyStr}`);
      }
    } catch (error) {
      console.log(`  解析错误: ${error.message}`);
      console.log(`  原始内容: ${req.body}`);
    }
  } else {
    console.log('📦 请求体: 无');
  }
  
  // 打印重要的请求头
  console.log('📄 请求头:');
  const headersToShow = {
    'user-agent': req.headers['user-agent'],
    'content-type': req.headers['content-type'],
    referer: req.headers['referer'] || req.headers['referrer'],
    'content-length': req.headers['content-length'],
    'x-forwarded-for': req.headers['x-forwarded-for']
  };
  
  Object.keys(headersToShow).forEach(key => {
    if (headersToShow[key]) {
      console.log(`  ${key}: ${headersToShow[key]}`);
    }
  });
  
  console.log('--- 请求日志结束 ---\n');
}
