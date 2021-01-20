/* eslint-disable no-param-reassign */
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const { id } = routeParams;

      const favoriteFoods = await api.get('/favorites');
      const foodFound = favoriteFoods.data.find(
        (favoriteFood: Food) => favoriteFood.id === id,
      );

      setIsFavorite(!!foodFound);

      const loadedFood = await api.get(`/foods/${id}`);

      setFood({
        ...loadedFood.data,
        price: parseFloat(loadedFood.data.price),
        formattedPrice: formatValue(loadedFood.data.price),
      });

      const formattedExtras = loadedFood.data.extras.map((extra: Extra) => ({
        ...extra,
        quantity: 0,
      }));

      setExtras(formattedExtras);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const updatedExtras = extras.map(extra => {
      if (extra.id === id) {
        Object.assign(extra, { ...extra, quantity: extra.quantity + 1 });
      }
      return extra;
    });
    setExtras(updatedExtras);
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const updatedExtras = extras.map(extra => {
      if (extra.id === id && extra.quantity > 0) {
        Object.assign(extra, { ...extra, quantity: extra.quantity - 1 });
      }
      return extra;
    });
    setExtras(updatedExtras);
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(prev => prev + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    setFoodQuantity(prev => (prev > 1 ? prev - 1 : prev));
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not

    if (isFavorite) {
      api.delete(`/favorites/${food.id}`);
    } else {
      const formattedFood = { ...food };
      delete formattedFood.extras;

      api.post('/favorites', {
        ...formattedFood,
      });
    }

    setIsFavorite(prev => !prev);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const extraTotalValue = extras.reduce((extraTotal, extra) => {
      extraTotal += extra.quantity * extra.value;
      return extraTotal;
    }, 0);

    const value = (extraTotalValue + food.price) * foodQuantity;

    return value;
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    const loadedFood = await api.get(`/foods/${food.id}`);

    api.post('/orders', {
      name: loadedFood.data.name,
      product_id: loadedFood.data.id,
      description: loadedFood.data.description,
      price: parseFloat(loadedFood.data.price),
      category: loadedFood.data.category,
      thumbnail_url: loadedFood.data.thumbnail_url,
      extras,
    });
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">
              {formatValue(cartTotal)}
            </TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
