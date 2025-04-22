// Autenticação e gerenciamento de usuários
let auth = {
  currentUser: null,
  
  // Inicializar autenticação
  init: function() {
    // Verificar se há usuário salvo
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      return true;
    }
    return false;
  },
  
  // Login com Google (simulado)
  loginWithGoogle: function() {
    return new Promise((resolve) => {
      // Simular login com Google
      setTimeout(() => {
        const user = {
          uid: 'google-user-123',
          displayName: 'Usuário Google',
          email: 'usuario@gmail.com',
          photoURL: 'img/default-user.png'
        };
        
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        resolve(user);
      }, 1000);
    });
  },
  
  // Login como convidado
  loginAsGuest: function() {
    const user = {
      uid: 'guest-user',
      displayName: 'Convidado',
      email: 'convidado@exemplo.com',
      photoURL: 'img/default-user.png'
    };
    
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  },
  
  // Logout
  signOut: function() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    return Promise.resolve();
  }
};

// Configurar eventos de autenticação
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar autenticação
  const isLoggedIn = auth.init();
  
  // Configurar botões de login
  const googleLoginButton = document.getElementById('googleLoginButton');
  const guestLoginButton = document.getElementById('guestLoginButton');
  
  if (googleLoginButton) {
    googleLoginButton.addEventListener('click', () => {
      auth.loginWithGoogle()
        .then(user => {
          updateUserInfo(user);
          hideLoginModal();
          showScreen('home');
        })
        .catch(error => {
          console.error('Erro no login com Google:', error);
          alert('Erro ao fazer login com Google. Tente novamente.');
        });
    });
  }
  
  if (guestLoginButton) {
    guestLoginButton.addEventListener('click', () => {
      const user = auth.loginAsGuest();
      updateUserInfo(user);
      hideLoginModal();
      showScreen('home');
    });
  }
  
  // Configurar botão de logout
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      auth.signOut()
        .then(() => {
          showLoginModal();
        })
        .catch(error => {
          console.error('Erro ao fazer logout:', error);
        });
    });
  }
  
  // Verificar estado de autenticação
  if (isLoggedIn && auth.currentUser) {
    updateUserInfo(auth.currentUser);
    showScreen('home');
  } else {
    showLoginModal();
  }
});

// Expor autenticação globalmente
window.auth = auth;
