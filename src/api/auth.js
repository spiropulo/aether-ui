import { gql } from '@apollo/client/core'

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        tenantId
        organizationName
        username
        email
        firstName
        lastName
        displayName
        avatarUrl
        role
        status
        loggedIn
        lastLoginAt
        lastLogoutAt
      }
    }
  }
`

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        tenantId
        organizationName
        username
        email
        firstName
        lastName
        displayName
        role
        status
        loggedIn
        lastLoginAt
        lastLogoutAt
      }
    }
  }
`

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($id: ID!, $tenantId: String!, $input: ChangePasswordInput!) {
    changePassword(id: $id, tenantId: $tenantId, input: $input)
  }
`

export const LOGOUT = gql`
  mutation Logout($id: ID!, $tenantId: String!) {
    logout(id: $id, tenantId: $tenantId)
  }
`

export const ADD_MEMBER = gql`
  mutation AddMember($input: AddMemberInput!, $organizationName: String!) {
    addMember(input: $input, organizationName: $organizationName) {
      id
      username
      email
      firstName
      lastName
      displayName
      role
      status
      createdAt
    }
  }
`
