import express from 'express';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

const SWAGGER_AUTH_SCRIPT = `
(function () {
  function createLoginPanel(ui, topbar) {
    if (document.getElementById('swagger-local-login')) {
      return;
    }

    var panel = document.createElement('div');
    panel.id = 'swagger-local-login';
    panel.style.display = 'flex';
    panel.style.gap = '8px';
    panel.style.alignItems = 'center';
    panel.style.marginLeft = '12px';

    var emailInput = document.createElement('input');
    emailInput.placeholder = 'email';
    emailInput.style.padding = '6px 8px';
    emailInput.style.border = '1px solid #d1d5db';
    emailInput.style.borderRadius = '4px';

    var passwordInput = document.createElement('input');
    passwordInput.placeholder = 'password';
    passwordInput.type = 'password';
    passwordInput.style.padding = '6px 8px';
    passwordInput.style.border = '1px solid #d1d5db';
    passwordInput.style.borderRadius = '4px';

    var loginButton = document.createElement('button');
    loginButton.textContent = 'Login';
    loginButton.style.padding = '6px 10px';

    var clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.style.padding = '6px 10px';

    loginButton.onclick = async function () {
      var email = emailInput.value.trim();
      var password = passwordInput.value.trim();

      if (!email || !password) {
        alert('Informe email e senha.');
        return;
      }

      try {
        var response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email: email, password: password})
        });

        var payload = await response.json();

        if (!response.ok) {
          alert(payload.message || payload.error || 'Falha no login');
          return;
        }

        if (!payload.access_token) {
          alert('Resposta sem access_token');
          return;
        }

        ui.preauthorizeApiKey('jwt', payload.access_token);
        localStorage.setItem('swagger_local_access_token', payload.access_token);
        alert('Login realizado e token aplicado no Swagger.');
      } catch (_error) {
        alert('Erro ao autenticar.');
      }
    };

    clearButton.onclick = function () {
      localStorage.removeItem('swagger_local_access_token');
      ui.preauthorizeApiKey('jwt', '');
      passwordInput.value = '';
    };

    panel.appendChild(emailInput);
    panel.appendChild(passwordInput);
    panel.appendChild(loginButton);
    panel.appendChild(clearButton);
    topbar.appendChild(panel);

    var savedToken = localStorage.getItem('swagger_local_access_token');
    if (savedToken) {
      ui.preauthorizeApiKey('jwt', savedToken);
    }
  }

  function bootstrap() {
    var ui = window.ui;
    var topbar = document.querySelector('.topbar-wrapper');

    if (!ui || !topbar) {
      return false;
    }

    createLoginPanel(ui, topbar);
    return true;
  }

  var attempts = 0;
  var timer = setInterval(function () {
    if (bootstrap() || attempts > 30) {
      clearInterval(timer);
    }
    attempts += 1;
  }, 300);
})();
`;

export function configureSwagger(app: express.Application) {
  app.use('/api-docs', swaggerUi.serve);

  const swaggerPath = path.join(__dirname, '../../../build/swagger.json');

  app.get('/api-docs/swagger-auth.js', (_req, res) => {
    res.type('application/javascript').send(SWAGGER_AUTH_SCRIPT);
  });

  app.get('/api-docs', swaggerUi.setup(
    require(swaggerPath),
    {
      swaggerOptions: {
        url: '/swagger.json',
        persistAuthorization: true,
        displayRequestDuration: true
      },
      customJs: '/api-docs/swagger-auth.js',
    }
  ));
}
