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
  
  // 获取请求参数（查询参数+请求体）
  const requestParams = getRequestParams(req);
  
  // 生成日志信息
  const logMessage = generateLogMessage(clientIP, path, req.method, requestParams);
  
  // 打印Vercel日志
  console.log(logMessage);
  
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
    // 额外的/test端点日志（更详细）
    console.log(`[TEST接口] ${logMessage}`);
    
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
    console.log(`[首页] ${logMessage}`);
    
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
 * 获取请求参数（查询参数+请求体）
 */
function getRequestParams(req) {
  let params = {};
  
  // 添加查询参数
  if (req.query && Object.keys(req.query).length > 0) {
    params.query = req.query;
  }
  
  // 添加请求体参数
  if (req.body) {
    try {
      // 如果是JSON字符串，尝试解析
      if (typeof req.body === 'string') {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          params.body = JSON.parse(req.body);
        } else {
          params.body = req.body;
        }
      } else {
        params.body = req.body;
      }
    } catch (e) {
      params.body = { error: '无法解析请求体' };
    }
  }
  
  return params;
}

/**
 * 生成日志消息
 * 格式：ip-接口-请求方式-参数
 */
function generateLogMessage(ip, path, method, params) {
  // 格式化时间
  const now = new Date();
  const timeStr = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
  
  // 简化路径显示
  const shortPath = path === '/' ? '根路径' : path;
  
  // 简化参数显示
  let paramStr = '无参数';
  if (params.query || params.body) {
    const paramParts = [];
    
    if (params.query && Object.keys(params.query).length > 0) {
      paramParts.push(`查询:${Object.keys(params.query).join(',')}`);
    }
    
    if (params.body) {
      if (typeof params.body === 'object') {
        paramParts.push(`体:${Object.keys(params.body).join(',')}`);
      } else {
        paramParts.push(`体:${typeof params.body}`);
      }
    }
    
    paramStr = paramParts.join(';');
    
    // 限制参数字符串长度
    if (paramStr.length > 100) {
      paramStr = paramStr.substring(0, 100) + '...';
    }
  }
  
  // 构建最终日志消息
  return `${timeStr} | ${ip} - ${shortPath} - ${method} - ${paramStr}`;
}
