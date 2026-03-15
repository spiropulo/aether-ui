import { gql } from '@apollo/client/core'

export const GET_TENANTS = gql`
  query GetTenants($tenantId: String!) {
    tenants(tenantId: $tenantId) {
      id
      tenantId
      organizationName
      displayName
      email
      status
      subscriptionPlan
      createdAt
      updatedAt
    }
  }
`

export const GET_TENANT = gql`
  query GetTenant($id: ID!, $tenantId: String!) {
    tenant(id: $id, tenantId: $tenantId) {
      id
      tenantId
      organizationName
      displayName
      email
      status
      subscriptionPlan
      createdAt
      updatedAt
    }
  }
`

export const CREATE_TENANT = gql`
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      id
      tenantId
      organizationName
      displayName
      email
      status
      subscriptionPlan
      createdAt
    }
  }
`

export const UPDATE_TENANT = gql`
  mutation UpdateTenant($id: ID!, $tenantId: String!, $input: UpdateTenantInput!) {
    updateTenant(id: $id, tenantId: $tenantId, input: $input) {
      id
      organizationName
      displayName
      status
      subscriptionPlan
      updatedAt
    }
  }
`

export const DELETE_TENANT = gql`
  mutation DeleteTenant($id: ID!, $tenantId: String!) {
    deleteTenant(id: $id, tenantId: $tenantId)
  }
`
