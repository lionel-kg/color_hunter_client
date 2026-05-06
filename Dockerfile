FROM node:24-alpine 
WORKDIR /app

COPY package.json  ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PORT=5173
ENV HOSTNAME=0.0.0.0


EXPOSE 5173

CMD ["npm", "run", "start"]
