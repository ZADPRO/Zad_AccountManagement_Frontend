import api from "./api";

export const getSignatureAuthorities =
  async () => {

    const response =
      await api.get(
        "/signature-authorities"
      );

    return response.data;
};

export const createSignatureAuthority =
  async (data: any) => {

    const response =
      await api.post(
        "/signature-authorities",
        data
      );

    return response.data;
};

export const updateSignatureAuthority =
  async (
    id: number,
    data: any
  ) => {

    const response =
      await api.put(
        `/signature-authorities/${id}`,
        data
      );

    return response.data;
};

export const deleteSignatureAuthority =
  async (id: number) => {

    const response =
      await api.delete(
        `/signature-authorities/${id}`
      );

    return response.data;
};