FROM node:16
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN chmod +x ./wait-for-it.sh
RUN apt-get update && apt-get install -y netcat
ENV PORT=8000
ENV MYSQL_HOST=mysql-server
EXPOSE ${PORT}
CMD [ "npm", "start" ]
