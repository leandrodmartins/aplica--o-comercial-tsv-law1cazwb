migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: false,
          values: ['tsv', 'vendedor'],
          maxSelect: 1,
        }),
      )
    }

    if (!users.fields.getByName('distribuidora')) {
      users.fields.add(
        new TextField({
          name: 'distribuidora',
          required: false,
        }),
      )
    }

    if (!users.fields.getByName('cargo')) {
      users.fields.add(
        new TextField({
          name: 'cargo',
          required: false,
        }),
      )
    }

    // Update users rules to allow TSV admin or self access, and protect role modification
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = "@request.auth.role = 'tsv' || @request.auth.id = ''"
    users.updateRule = "id = @request.auth.id || @request.auth.role = 'tsv'"
    users.deleteRule = "@request.auth.role = 'tsv'"

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('role')) {
      users.fields.removeByName('role')
    }
    if (users.fields.getByName('distribuidora')) {
      users.fields.removeByName('distribuidora')
    }
    if (users.fields.getByName('cargo')) {
      users.fields.removeByName('cargo')
    }
    app.save(users)
  },
)
