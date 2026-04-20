export interface ClientListModel {
    clientId: number;
    clientCode: string;
    name: string;
    businessName: string;
    isActive: boolean;
    updatedAt: string;
    createdAt: string;
    createdBy: number;
    updatedBy: number; 

}

// Since your JSON is wrapped in a "clients" key, define this too:
export interface ClientsResponse {
    clients: ClientListModel[];
}