module.exports = function (plop) {
  plop.setGenerator('page', {
    description: 'Créer une nouvelle page',
    prompts: [{ type: 'input', name: 'name', message: 'Nom de la page ?' }],
    actions: [
      {
        type: 'add',
        path: 'src/pages/{{pascalCase name}}/{{pascalCase name}}.jsx',
        templateFile: 'plop-templates/Page.jsx.hbs',
      },
      {
        type: 'add',
        path: 'src/pages/{{pascalCase name}}/{{pascalCase name}}.module.css',
        templateFile: 'plop-templates/Page.module.css.hbs',
      },
    ],
  });

  plop.setGenerator('component', {
    description: 'Créer un nouveau composant',
    prompts: [{ type: 'input', name: 'name', message: 'Nom du composant ?' }],
    actions: [
      {
        type: 'add',
        path: 'src/components/{{pascalCase name}}/{{pascalCase name}}.jsx',
        templateFile: 'plop-templates/Component.jsx.hbs',
      },
      {
        type: 'add',
        path: 'src/components/{{pascalCase name}}/{{pascalCase name}}.module.css',
        templateFile: 'plop-templates/Component.module.css.hbs',
      },
    ],
  });
};
