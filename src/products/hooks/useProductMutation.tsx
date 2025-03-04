import { useMutation, useQueryClient } from "@tanstack/react-query";
//
import { Product, productActions } from "..";

// ----------------------------------------------------------------------

export const useProductMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: productActions.createProduct,
    onMutate: (product) => {
      console.log("Mutation started");

      // Optimistic product
      const optimisticProduct = {
        id: Math.random(),
        ...product,
      };
      console.log(
        "🚀 ~ useProductMutation ~ optimisticProduct:",
        optimisticProduct
      );

      // Add optimistic product to cache
      queryClient.setQueryData<Product[]>(
        ["products", { filterKey: product.category }],
        (old) => {
          if (!old) return [optimisticProduct];

          return [...old, optimisticProduct];
        }
      );

      return {optimisticProduct};
    },
    onSuccess: (product, variables, context) => {
      // console.log({ product, variables, context });
      
      // queryClient.invalidateQueries({
      //   queryKey: ["products", { filterKey: data.category }],
      // });

      queryClient.removeQueries({
        queryKey: ["product", context?.optimisticProduct.id],
      });

      queryClient.setQueryData<Product[]>(
        ["products", { filterKey: product.category }],
        (old) => {
          if (!old) return [product];

          return old.map((cacheProduct) => {
            return cacheProduct.id === context?.optimisticProduct.id ? product : cacheProduct
          });
        }
      );
    },
    // onSettled: () => {
    //   console.log("Mutation settled");
    // },
    onError: (error, variables, context) => {
      console.log({ error, variables, context });

      queryClient.removeQueries({
        queryKey: ["product", context?.optimisticProduct.id],
      });

      queryClient.setQueryData<Product[]>(
        ["products", { filterKey: variables.category }],
        (old) => {
          if (!old) return [];

          return old.filter((cacheProduct) => {
            return cacheProduct.id !== context?.optimisticProduct.id
          });
        }
      );
    }
  });

  return mutation;
};
