import UserManagement from '../UserManagement'

export default function UserManagementExample() {
  return (
    <div className="p-6">
      <UserManagement 
        onCreateUser={(userData) => console.log('Create user:', userData)}
        onEditUser={(id, userData) => console.log('Edit user:', id, userData)}
        onDeleteUser={(id) => console.log('Delete user:', id)}
        onChangeRole={(id, role) => console.log('Change role:', id, role)}
      />
    </div>
  )
}