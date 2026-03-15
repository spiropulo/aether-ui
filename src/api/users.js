import { gql } from '@apollo/client/core'

// Lightweight query used by AuthContext to poll session validity.
// Only requests the fields needed to detect a server-side logout.
export const GET_SESSION_STATUS = gql`
  query GetSessionStatus($id: ID!, $tenantId: String!) {
    userProfile(id: $id, tenantId: $tenantId) {
      id
      loggedIn
      lastLogoutAt
    }
  }
`

export const GET_USER_PROFILES = gql`
  query GetUserProfiles($tenantId: String!, $page: PageInput, $search: String) {
    userProfiles(tenantId: $tenantId, page: $page, search: $search) {
      items {
        id
        username
        email
        organizationName
        firstName
        lastName
        displayName
        avatarUrl
        role
        status
        loggedIn
        lastLoginAt
        lastLogoutAt
        createdAt
      }
      total
      hasNext
      limit
      offset
    }
  }
`

export const GET_USER_PROFILE = gql`
  query GetUserProfile($id: ID!, $tenantId: String!) {
    userProfile(id: $id, tenantId: $tenantId) {
      id
      username
      email
      organizationName
      firstName
      lastName
      displayName
      avatarUrl
      phoneNumber
      role
      status
      loggedIn
      lastLoginAt
      lastLogoutAt
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($id: ID!, $tenantId: String!, $input: UpdateProfileInput!) {
    updateProfile(id: $id, tenantId: $tenantId, input: $input) {
      id
      username
      email
      organizationName
      firstName
      lastName
      displayName
      avatarUrl
      phoneNumber
      role
      status
      loggedIn
      lastLogoutAt
      updatedAt
    }
  }
`

export const DELETE_PROFILE = gql`
  mutation DeleteProfile($id: ID!, $tenantId: String!) {
    deleteProfile(id: $id, tenantId: $tenantId)
  }
`
