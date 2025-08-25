export interface DepartmentNode {
  department: string
  parent: string
  children: DepartmentNode[]
}

export interface CompanyStructure {
  root_node: string
  children: DepartmentNode[]
}

export interface FlatDepartment {
  id: string
  name: string
  parentId: string | null
  level: number
  path: string
  childrenCount: number
}